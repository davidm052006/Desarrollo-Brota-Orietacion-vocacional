// Página Comunidad: pestañas, navegación a los detalles, botón flotante y
// modales de compartir historia y hacer pregunta. comunidadService es stub.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ok, falla } from '../../test/helpers';

vi.mock('../../components/Layout/DashboardLayout', () => ({ default: ({ children }) => <main>{children}</main> }));

const api = vi.hoisted(() => ({
  getForos: vi.fn(), getHistorias: vi.fn(), getPreguntas: vi.fn(), getConvocatorias: vi.fn(),
  crearHistoria: vi.fn(), crearPregunta: vi.fn(), ocultarPublicacion: vi.fn(), eliminarPublicacion: vi.fn(),
}));
vi.mock('../../services/comunidadService', () => api);

import Comunidad from './Comunidad';

function Destino() {
  const { pathname } = useLocation();
  return <p>En {pathname}</p>;
}

function montar(state) {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[{ pathname: '/dashboard/comunidad', state }]}>
      <Routes>
        <Route path="/dashboard/comunidad" element={<Comunidad />} />
        <Route path="/dashboard/comunidad/*" element={<Destino />} />
      </Routes>
    </MemoryRouter>,
  );
  return user;
}

const FOROS = [{ id: 'f1', icon: '💻', nombre: 'Tecnología', posts: 12 }];
const HISTORIAS = [{ id: 'h1', title: 'Mi camino al SENA', excerpt: 'Empecé…', name: 'Leo', ini: 'L', carrera: 'ADSO', inst: 'SENA', tag: 'Tecnología', likes: 4, date: 'oct' }];
const PREGUNTAS = [
  { id: 'q1', title: '¿Becas para artes?', area: 'Artes', name: 'Sol', ini: 'S', time: 'hoy', answers: 0, resuelta: false },
  { id: 'q2', title: '¿Qué es un tecnólogo?', area: 'General', name: 'Ana', ini: 'A', time: 'ayer', answers: 3, resolved: true },
];
const CONVOCATORIAS = [
  { id: 'c1', type: 'Beca', title: 'Generación E', inst: 'MEN', city: 'Nacional', days: 3 },
  { id: 'c2', type: 'Evento', title: 'Feria U', inst: 'UdeA', city: 'Medellín', days: 20 },
];

beforeEach(() => {
  vi.clearAllMocks();
  api.getForos.mockResolvedValue(ok(FOROS));
  api.getHistorias.mockResolvedValue(ok(HISTORIAS));
  api.getPreguntas.mockResolvedValue(ok(PREGUNTAS));
  api.getConvocatorias.mockResolvedValue(ok(CONVOCATORIAS));
});

describe('pestañas', () => {
  it('arranca en Foros y entrar a un foro navega a su detalle', async () => {
    const user = montar();
    expect(await screen.findByText('12 posts activos')).toBeInTheDocument();
    await user.click(screen.getByText('Tecnología', { selector: 'div' }));
    expect(screen.getByText('En /dashboard/comunidad/foro/f1')).toBeInTheDocument();
  });

  it('Historias: lista y "leer" navega', async () => {
    const user = montar();
    await user.click(await screen.findByRole('button', { name: 'Historias reales' }));
    expect(screen.getByText('Mi camino al SENA')).toBeInTheDocument();
    expect(screen.getByText('ADSO · SENA')).toBeInTheDocument();
    await user.click(screen.getByText(/Leer/));
    expect(screen.getByText('En /dashboard/comunidad/historia/h1')).toBeInTheDocument();
  });

  it('Preguntas: marca las resueltas y abrir una navega como pregunta', async () => {
    const user = montar();
    await user.click(await screen.findByRole('button', { name: 'Preguntas' }));
    expect(screen.getByText('Resuelta ✓')).toBeInTheDocument();
    await user.click(screen.getByText('¿Qué es un tecnólogo?'));
    expect(screen.getByText('En /dashboard/comunidad/post/q2')).toBeInTheDocument();
  });

  it('Convocatorias: filtra por tipo y "Ver más" navega', async () => {
    const user = montar();
    await user.click(await screen.findByRole('button', { name: 'Convocatorias' }));
    expect(screen.getAllByText('Feria U').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Beca' }));
    await user.click(screen.getByRole('button', { name: 'SENA' }));
    expect(screen.getByText('No hay convocatorias en esta categoría.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Todas' }));
    await user.click(screen.getAllByRole('button', { name: 'Ver más →' })[0]);
    expect(screen.getByText('En /dashboard/comunidad/convocatoria/c1')).toBeInTheDocument();
  });

  it('la barra lateral muestra preguntas sin respuesta y convocatorias que cierran pronto', async () => {
    montar();
    await screen.findByText('12 posts activos');
    expect(screen.getAllByText('¿Becas para artes?').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Generación E').length).toBeGreaterThan(0);
    expect(screen.queryByText('Feria U')).not.toBeInTheDocument();
  });

  it('puede abrir directamente una pestaña desde el state', async () => {
    montar({ tab: 'preguntas' });
    expect(await screen.findByText('¿Tienes una duda? Pregúntale a la comunidad…')).toBeInTheDocument();
  });

  it('listas vacías muestran su invitación', async () => {
    api.getHistorias.mockResolvedValue(ok([]));
    api.getPreguntas.mockResolvedValue(falla('x'));
    const user = montar();
    await user.click(await screen.findByRole('button', { name: 'Historias reales' }));
    expect(screen.getByText('Sé el primero en compartir tu historia.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Preguntas' }));
    expect(screen.getByText('No hay preguntas aún.')).toBeInTheDocument();
  });
});

describe('publicar', () => {
  it('compartir historia: error y luego éxito', async () => {
    api.crearHistoria.mockResolvedValueOnce(falla('Muy corta')).mockResolvedValueOnce(ok());
    const user = montar();
    await user.click(await screen.findByRole('button', { name: 'Historias reales' }));
    await user.click(screen.getByRole('button', { name: '+ Compartir tu historia' }));
    await user.type(screen.getByPlaceholderText('¿Cómo fue tu camino?'), 'Cambié de carrera');
    await user.type(screen.getByPlaceholderText('Cuéntanos cómo fue tu proceso…'), 'Fue duro pero valió la pena');
    await user.click(screen.getByRole('button', { name: 'Enviar historia' }));
    expect(await screen.findByText('Muy corta')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Enviar historia' }));
    await user.click(await screen.findByRole('button', { name: 'Perfecto' }));
    expect(api.crearHistoria).toHaveBeenLastCalledWith(expect.objectContaining({ titulo: 'Cambié de carrera', area: 'Artes', anonimo: true }));
    expect(screen.queryByRole('button', { name: 'Enviar historia' })).not.toBeInTheDocument();
  });

  // Comportamiento actual (defecto, mismo patrón que DEF-02 #56): los chips de
  // área y el interruptor de anónimo son <button> sin type dentro del <form>,
  // así que elegir un área ENVÍA la historia. Al corregirlo (type="button"),
  // esta prueba debe pasar a esperar que crearHistoria NO se llame.
  it('elegir un área con el formulario lleno publica la historia (defecto)', async () => {
    api.crearHistoria.mockResolvedValue(ok());
    const user = montar();
    await user.click(await screen.findByRole('button', { name: 'Historias reales' }));
    await user.click(screen.getByRole('button', { name: '+ Compartir tu historia' }));
    await user.type(screen.getByPlaceholderText('¿Cómo fue tu camino?'), 'Título');
    await user.type(screen.getByPlaceholderText('Cuéntanos cómo fue tu proceso…'), 'Texto');
    await user.click(screen.getByRole('button', { name: 'Salud' }));
    await waitFor(() => expect(api.crearHistoria).toHaveBeenCalledTimes(1));
    // ...y se envía con el área anterior: la que eligió la persona ni alcanza a guardarse
    expect(api.crearHistoria).toHaveBeenCalledWith(expect.objectContaining({ area: 'Artes' }));
  });

  it('el botón flotante abre el modal de historia o de pregunta según la pestaña', async () => {
    api.crearPregunta.mockResolvedValue(ok());
    const user = montar();
    await screen.findByText('12 posts activos');
    await user.click(screen.getByRole('button', { name: '+' }));
    await user.type(screen.getByPlaceholderText('¿Qué quieres saber?'), '¿Sirve el ICFES?');
    await user.click(screen.getByRole('button', { name: 'Publicar pregunta' }));
    await user.click(await screen.findByRole('button', { name: 'Ver comunidad' }));
    expect(api.crearPregunta).toHaveBeenCalledWith(expect.objectContaining({ titulo: '¿Sirve el ICFES?' }));
    await waitFor(() => expect(api.getPreguntas).toHaveBeenCalledTimes(2));

    await user.click(screen.getByRole('button', { name: 'Historias reales' }));
    await user.click(screen.getByRole('button', { name: '✍️' }));
    expect(screen.getByPlaceholderText('¿Cómo fue tu camino?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Convocatorias' }));
    expect(screen.queryByRole('button', { name: '+' })).not.toBeInTheDocument();
  });
});
