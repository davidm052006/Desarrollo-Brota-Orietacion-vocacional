import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TestVocacional from './TestVocacional';
import * as perfilService from '../../../services/perfilService';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../../config/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { id: 'perfil-123' },
            error: null,
          }),
        })),
      })),
    })),
  },
}));

vi.mock('../../../services/perfilService', () => ({
  obtenerCuestionario: vi.fn(),
  guardarResultado: vi.fn(),
  obtenerResultado: vi.fn(),
  eliminarResultado: vi.fn(),
  obtenerRecomendaciones: vi.fn(),
  marcarRecomendacionVista: vi.fn(),
}));

vi.mock('../../../components/Layout/DashboardLayout', () => ({
  default: ({ children }) => (
    <div data-testid="dashboard-layout">
      {children}
    </div>
  ),
}));

vi.mock('./components/TestProgress', () => ({
  default: () => <div data-testid="test-progress" />,
}));

// Mockear react-chartjs-2 para evitar inicialización de chart.js en jsdom
vi.mock('react-chartjs-2', () => ({
  Radar: () => <div data-testid="radar-mock" />,
}));

const cuestionarioMock = {
  id: 'cuestionario-123',
  preguntas: [
    {
      id: 'pregunta-1',
      texto: '¿Qué actividad prefieres?',
      tipo: 'single',
      categoria: 'tecnologia',
      opciones: [
        {
          id: 'opcion-tecnologia',
          label: 'Programar y usar tecnología',
          icon: '💻',
          pesos: {
            tecnologia: 10,
          },
        },
        {
          id: 'opcion-arte',
          label: 'Dibujar y crear',
          icon: '🎨',
          pesos: {
            arte: 10,
          },
        },
      ],
    },
  ],
};

const resultadoMock = {
  id: 'resultado-123',
  perfil_vocacional: {
    categoriaPrincipal: 'tecnologia',
    categoriaSecundaria: 'arte',
    scores: [
      {
        categoria: 'tecnologia',
        puntos: 10,
        porcentaje: 100,
      },
      {
        categoria: 'arte',
        puntos: 0,
        porcentaje: 0,
      },
    ],
  },
};

describe('TestVocacional', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    perfilService.obtenerCuestionario.mockResolvedValue({
      success: true,
      data: cuestionarioMock,
    });

    perfilService.guardarResultado.mockResolvedValue({
      success: true,
      data: resultadoMock,
    });

    perfilService.obtenerResultado.mockResolvedValue({
      success: false,
      data: null,
    });

    perfilService.eliminarResultado.mockResolvedValue({
      success: true,
    });

    perfilService.obtenerRecomendaciones.mockResolvedValue({
      success: true,
      data: [],
    });
  });

  it('muestra el resultado con el área de mayor score', async () => {
    const user = userEvent.setup();

    render(
      <TestVocacional
        user={{ id: 'user-123' }}
        isDemoMode={false}
      />
    );

    const comenzar = await screen.findByRole('button', {
      name: /Comenzar test/i,
    });

    await user.click(comenzar);

    {
      const opciones = await screen.findAllByRole('button', { name: /Programar y usar tecnología/i });
      const opcionTecnologia = opciones.find(b => !b.disabled) || opciones[0];
      await user.click(opcionTecnologia);
    }

    {
      const botones = await screen.findAllByRole('button', { name: /Ver resultados/i });
      const boton = botones.find(b => !b.disabled) || botones[0];
      await user.click(boton);
    }

    // Verificar título principal del resultado usando selector .font-display
    const titulos = await screen.findAllByText(/Tecnología e Innovación/i, { selector: '.font-display' });
    expect(titulos.length).toBeGreaterThan(0);
    expect(titulos[0].textContent).toContain('Tecnología e Innovación');
    const principales = await screen.findAllByText('Principal');
    expect(principales.length).toBeGreaterThan(0);
  });

  it('no permite avanzar sin seleccionar una opción', async () => {
    const user = userEvent.setup();

    render(
      <TestVocacional
        user={{ id: 'user-123' }}
        isDemoMode={false}
      />
    );

    const comenzar = await screen.findByRole('button', {
      name: /Comenzar test/i,
    });

    await user.click(comenzar);

    const botones = await screen.findAllByRole('button', { name: /Ver resultados/i });
    const botonResultados = botones.find(b => !b.disabled) || botones[0];

    expect(botonResultados.disabled).toBe(true);
  });

  it('guarda el resultado al finalizar el test', async () => {
    const user = userEvent.setup();

    render(
      <TestVocacional
        user={{ id: 'user-123' }}
        isDemoMode={false}
      />
    );

    const comenzar = await screen.findByRole('button', {
      name: /Comenzar test/i,
    });

    await user.click(comenzar);

    {
      const opciones = await screen.findAllByRole('button', { name: /Programar y usar tecnología/i });
      const opcionTecnologia = opciones.find(b => !b.disabled) || opciones[0];
      await user.click(opcionTecnologia);
    }

    {
      const botones = await screen.findAllByRole('button', { name: /Ver resultados/i });
      const botonResultados = botones.find(b => !b.disabled) || botones[0];
      await user.click(botonResultados);
    }

    // Esperar que el resultado se muestre (específico: elemento con la clase .font-display)
    const titulos = await screen.findAllByText(/Tecnología e Innovación/i, { selector: '.font-display' });
    expect(titulos.length).toBeGreaterThan(0);
    expect(titulos[0].textContent).toContain('Tecnología e Innovación');
    const principales = await screen.findAllByText('Principal');
    expect(principales.length).toBeGreaterThan(0);

    expect(perfilService.guardarResultado).toHaveBeenCalledTimes(1);
  });
});

it('muestra el resultado previo guardado', async () => {
  const user = userEvent.setup();

  perfilService.obtenerResultado.mockResolvedValue({
    success: true,
    data: resultadoMock,
  });

  render(
    <TestVocacional
      user={{ id: 'user-123' }}
      isDemoMode={false}
    />
  );

  const botones = await screen.findAllByRole('button', { name: /Ver mi resultado anterior/i });
  const botonResultado = botones.find(b => !b.disabled) || botones[0];

  await user.click(botonResultado);

  const titulosPrev = await screen.findAllByText(/Tecnología e Innovación/i, { selector: '.font-display' });
  expect(titulosPrev.length).toBeGreaterThan(0);
  expect(titulosPrev[0].textContent).toContain('Tecnología e Innovación');
  const principalesPrev = await screen.findAllByText('Principal');
  expect(principalesPrev.length).toBeGreaterThan(0);

  // El componente actualmente guarda/actualiza el resultado al mostrarlo, verificar que se llamó al servicio
  expect(perfilService.guardarResultado).toHaveBeenCalled();
});
