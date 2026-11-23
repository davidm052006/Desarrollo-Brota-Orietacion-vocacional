import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import FeedReciente from './FeedReciente';
import { getFeedReciente } from '../../../services/comunidadService';

// Doble del servicio (stub): el componente solo usa getFeedReciente.
vi.mock('../../../services/comunidadService', () => ({ getFeedReciente: vi.fn() }));

afterEach(cleanup);
// Con llaves: si el beforeEach devolviera el mock, Vitest lo llamaría como
// limpieza al terminar cada test (y con la promesa pendiente, se colgaría).
beforeEach(() => {
  vi.mocked(getFeedReciente).mockReset();
});

const REALES = [
  { id: 'h1', tipo: 'historia', titulo: 'Me cambié de carrera y no me arrepiento', autor: 'Laura G.', time: 'hace 2 h', link: '/dashboard/comunidad/historia/h1' },
  { id: 'q1', tipo: 'pregunta', titulo: '¿Vale la pena estudiar Medicina?', autor: 'Anónimo', time: 'hace 5 h', link: '/dashboard/comunidad/pregunta/q1' },
];

// Muestra a dónde navegó el componente y con qué state, para comprobarlo.
function Destino() {
  const { pathname, state } = useLocation();
  return <p>{`destino:${pathname} state:${JSON.stringify(state)}`}</p>;
}

function montar(props) {
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/dashboard" element={<FeedReciente {...props} />} />
        <Route path="*" element={<Destino />} />
      </Routes>
    </MemoryRouter>,
  );
  return userEvent.setup();
}

const tarjetas = () => screen.getAllByRole('button').filter((b) => b.textContent !== 'Ver comunidad →');

describe('FeedReciente — Brayan / S3', () => {
  it('muestra "Cargando…" mientras la petición del feed no responde', () => {
    // Arrange: una promesa que nunca se resuelve deja el componente cargando
    vi.mocked(getFeedReciente).mockReturnValue(new Promise(() => {}));

    // Act
    montar({ limite: 4 });

    // Assert
    expect(screen.getByText('Cargando…')).toBeTruthy();
    expect(tarjetas()).toHaveLength(0);
  });

  it('pone primero las publicaciones reales y completa con relleno hasta el límite', async () => {
    // Arrange
    vi.mocked(getFeedReciente).mockResolvedValue({ success: true, data: REALES });

    // Act
    montar({ limite: 4 });

    // Assert
    expect(await screen.findByRole('button', { name: /Me cambié de carrera/ })).toBeTruthy();
    const titulos = tarjetas().map((b) => b.textContent);
    expect(titulos).toHaveLength(4);
    expect(titulos[0]).toContain('Me cambié de carrera');
    expect(titulos[1]).toContain('¿Vale la pena estudiar Medicina?');
    // Las dos restantes son el relleno de la beta
    expect(titulos[2]).toContain('Encontré mi carrera gracias al test vocacional');
    expect(screen.queryByText('Cargando…')).toBeNull();
  });

  it('nunca muestra más publicaciones reales que el límite ni agrega relleno si sobran', async () => {
    // Arrange
    const muchas = Array.from({ length: 6 }, (_, i) => ({ ...REALES[0], id: `h${i}`, titulo: `Real ${i}` }));
    vi.mocked(getFeedReciente).mockResolvedValue({ success: true, data: muchas });

    // Act
    montar({ limite: 4 });

    // Assert
    await screen.findByRole('button', { name: /Real 0/ });
    expect(tarjetas().map((b) => b.textContent)).toEqual(
      expect.arrayContaining([expect.stringContaining('Real 3')]),
    );
    expect(tarjetas()).toHaveLength(4);
    expect(screen.queryByText(/Real 4/)).toBeNull();
    expect(screen.queryByText(/Encontré mi carrera/)).toBeNull();
  });

  it('si el feed falla no se queda cargando: muestra el relleno', async () => {
    // Arrange: el service nunca lanza, devuelve success: false
    vi.mocked(getFeedReciente).mockResolvedValue({ success: false, error: 'Error de conexión' });

    // Act
    montar({ limite: 3 });

    // Assert
    expect(await screen.findByRole('button', { name: /Encontré mi carrera/ })).toBeTruthy();
    expect(tarjetas()).toHaveLength(3);
    expect(screen.queryByText('Cargando…')).toBeNull();
  });

  it('clic en una publicación real navega a su detalle', async () => {
    // Arrange
    vi.mocked(getFeedReciente).mockResolvedValue({ success: true, data: REALES });
    const user = montar({ limite: 2 });

    // Act
    await user.click(await screen.findByRole('button', { name: /Vale la pena estudiar Medicina/ }));

    // Assert
    expect(screen.getByText(/^destino:\/dashboard\/comunidad\/pregunta\/q1/)).toBeTruthy();
  });

  it('clic en un relleno lleva a la pestaña de Comunidad de su tipo', async () => {
    // Arrange: sin publicaciones reales, la primera tarjeta es una historia de relleno
    vi.mocked(getFeedReciente).mockResolvedValue({ success: true, data: [] });
    const user = montar({ limite: 2 });

    // Act
    await user.click(await screen.findByRole('button', { name: /Encontré mi carrera/ }));

    // Assert
    expect(screen.getByText('destino:/dashboard/comunidad state:{"tab":"historias"}')).toBeTruthy();
  });

  it('"Ver comunidad →" lleva a Comunidad', async () => {
    // Arrange
    vi.mocked(getFeedReciente).mockResolvedValue({ success: true, data: REALES });
    const user = montar({ limite: 2 });
    await screen.findByRole('button', { name: /Me cambié de carrera/ });

    // Act
    await user.click(screen.getByRole('button', { name: 'Ver comunidad →' }));

    // Assert
    expect(screen.getByText(/^destino:\/dashboard\/comunidad state:/)).toBeTruthy();
  });
});
