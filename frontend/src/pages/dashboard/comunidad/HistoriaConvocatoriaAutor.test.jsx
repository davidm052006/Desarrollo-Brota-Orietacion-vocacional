// Detalle de historia (likes), de convocatoria (requisitos/pasos/urgencia) y
// ficha de autor (solo moderación). Servicios y rol son stubs.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ok, falla } from '../../../test/helpers';

vi.mock('../../../components/Layout/DashboardLayout', () => ({ default: ({ children }) => <main>{children}</main> }));

const api = vi.hoisted(() => ({
  getHistoria: vi.fn(), toggleLikeHistoria: vi.fn(), getConvocatoria: vi.fn(), getInfoAutor: vi.fn(),
  ocultarPublicacion: vi.fn(), eliminarPublicacion: vi.fn(),
}));
vi.mock('../../../services/comunidadService', () => api);

const rol = vi.hoisted(() => ({ valor: { puedeModerar: true, loading: false } }));
vi.mock('../../../hooks/useModeracion', () => ({ useModeracion: () => rol.valor }));

import HistoriaDetalle from './HistoriaDetalle';
import ConvocatoriaDetalle from './ConvocatoriaDetalle';
import AutorInfo from './AutorInfo';

function montar(entrada) {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/inicio', entrada]} initialIndex={1}>
      <Routes>
        <Route path="/inicio" element={<p>Página anterior</p>} />
        <Route path="/dashboard" element={<p>Dashboard</p>} />
        <Route path="/dashboard/comunidad" element={<p>Inicio comunidad</p>} />
        <Route path="/dashboard/comunidad/historia/:id" element={<HistoriaDetalle />} />
        <Route path="/dashboard/comunidad/convocatoria/:id" element={<ConvocatoriaDetalle />} />
        <Route path="/dashboard/comunidad/autor/:userId" element={<AutorInfo />} />
      </Routes>
    </MemoryRouter>,
  );
  return user;
}

beforeEach(() => {
  vi.clearAllMocks();
  rol.valor = { puedeModerar: true, loading: false };
});

describe('HistoriaDetalle', () => {
  const HISTORIA = {
    titulo: 'De Tumaco a la U', body: ['Primer párrafo', 'Segundo párrafo'], name: 'Mia', ini: 'M',
    carrera: 'Ingeniería', inst: 'UNAL', area: 'tecnologia', date: 'oct 2026', likes: 9, yo_di_like: false,
    relacionadas: [{ id: 'h2', title: 'Mi año en el SENA', name: 'Leo', ini: 'L', likes: 3 }],
  };

  it('muestra la historia por párrafos y alterna el like con el conteo del backend', async () => {
    api.getHistoria.mockResolvedValue(ok(HISTORIA));
    api.toggleLikeHistoria.mockResolvedValueOnce(ok({ likes: 10, yo_di_like: true })).mockResolvedValueOnce(falla('x'));
    const user = montar('/dashboard/comunidad/historia/h1');
    expect(await screen.findByText('De Tumaco a la U')).toBeInTheDocument();
    expect(screen.getByText('Segundo párrafo')).toBeInTheDocument();
    expect(screen.getByText('Ingeniería · UNAL')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /9 Me ayudó/ }));
    expect(await screen.findByRole('button', { name: /10 Me ayudó/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /10 Me ayudó/ }));
    expect(api.toggleLikeHistoria).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('button', { name: /10 Me ayudó/ })).toBeInTheDocument();
  });

  it('un body de texto simple también se muestra; las relacionadas navegan', async () => {
    api.getHistoria.mockResolvedValueOnce(ok({ ...HISTORIA, body: 'Un solo bloque', carrera: null }))
      .mockResolvedValueOnce(ok({ ...HISTORIA, titulo: 'Mi año en el SENA', relacionadas: [] }));
    const user = montar('/dashboard/comunidad/historia/h1');
    expect(await screen.findByText('Un solo bloque')).toBeInTheDocument();
    await user.click(screen.getByText('Mi año en el SENA'));
    expect(await screen.findByText('Mi año en el SENA', { selector: 'div' })).toBeInTheDocument();
    expect(api.getHistoria).toHaveBeenLastCalledWith('h2');
  });

  it('historia inexistente ofrece volver a Comunidad', async () => {
    api.getHistoria.mockResolvedValue(falla('404'));
    const user = montar('/dashboard/comunidad/historia/zz');
    expect(await screen.findByText('Historia no encontrada.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Volver' }));
    expect(screen.getByText('Inicio comunidad')).toBeInTheDocument();
  });

  it('"Más historias" vuelve a Comunidad', async () => {
    api.getHistoria.mockResolvedValue(ok({ ...HISTORIA, relacionadas: [] }));
    const user = montar('/dashboard/comunidad/historia/h1');
    await user.click(await screen.findByRole('button', { name: '← Más historias' }));
    expect(screen.getByText('Inicio comunidad')).toBeInTheDocument();
  });
});

describe('ConvocatoriaDetalle', () => {
  const CONV = {
    id: 5, type: 'Beca', title: 'Generación E', inst: 'MEN', city: 'Nacional', days: 2, descripcion: 'Beca total',
    url: 'https://men.gov.co', detalles: { requisitos: ['Ser bachiller'], pasos: [{ num: 1, texto: 'Inscribirse' }] },
  };

  it('con el state completo no consulta y muestra requisitos, pasos y enlace', async () => {
    montar({ pathname: '/dashboard/comunidad/convocatoria/5', state: { conv: CONV } });
    expect(screen.getByText('Ser bachiller')).toBeInTheDocument();
    expect(screen.getByText('Inscribirse')).toBeInTheDocument();
    expect(screen.getByText(/Cierra en 2 días/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /portal oficial/ })).toHaveAttribute('href', 'https://men.gov.co');
    expect(api.getConvocatoria).not.toHaveBeenCalled();
  });

  it('sin detalles los pide al backend', async () => {
    api.getConvocatoria.mockResolvedValue(ok({ ...CONV, url: '', days: 30, detalles: {} }));
    montar({ pathname: '/dashboard/comunidad/convocatoria/5', state: { conv: { id: 5, title: 'Generación E' } } });
    expect(await screen.findByText(/Cierra en 30 días/)).toBeInTheDocument();
    expect(api.getConvocatoria).toHaveBeenCalledWith('5');
    expect(screen.queryByRole('link', { name: /portal oficial/ })).not.toBeInTheDocument();
  });

  it('inexistente ofrece volver', async () => {
    api.getConvocatoria.mockResolvedValue(falla('404'));
    const user = montar('/dashboard/comunidad/convocatoria/99');
    expect(await screen.findByText('Convocatoria no encontrada.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Volver' }));
    expect(screen.getByText('Inicio comunidad')).toBeInTheDocument();
  });
});

describe('AutorInfo', () => {
  it('un moderador ve los datos reales del autor', async () => {
    api.getInfoAutor.mockResolvedValue(ok({ nombre: 'Ana', apellido: 'Ruiz', email: 'ana@x.co', ciudad: 'Cali', edad: 17, rol: 'estudiante', racha_dias: 0, created_at: '2026-01-02T00:00:00Z' }));
    const user = montar('/dashboard/comunidad/autor/u-7');
    expect(await screen.findByText('ana@x.co')).toBeInTheDocument();
    expect(screen.getByText('17 años')).toBeInTheDocument();
    expect(screen.getByText('0 días')).toBeInTheDocument();
    expect(api.getInfoAutor).toHaveBeenCalledWith('u-7');
    await user.click(screen.getByRole('button', { name: /Volver|←/ }));
    expect(screen.getByText('Página anterior')).toBeInTheDocument();
  });

  it('si el backend falla muestra el error', async () => {
    api.getInfoAutor.mockResolvedValue(falla('Usuario no encontrado'));
    montar('/dashboard/comunidad/autor/u-7');
    expect(await screen.findByText('Usuario no encontrado')).toBeInTheDocument();
  });

  it('quien no modera es enviado al dashboard sin consultar', async () => {
    rol.valor = { puedeModerar: false, loading: false };
    montar('/dashboard/comunidad/autor/u-7');
    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(api.getInfoAutor).not.toHaveBeenCalled();
  });

  it('mientras carga el rol no consulta', () => {
    rol.valor = { puedeModerar: false, loading: true };
    montar('/dashboard/comunidad/autor/u-7');
    expect(api.getInfoAutor).not.toHaveBeenCalled();
  });
});
