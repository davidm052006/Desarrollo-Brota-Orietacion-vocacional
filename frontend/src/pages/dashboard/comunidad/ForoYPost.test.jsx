// Detalle de un foro y de un post/pregunta de Comunidad, con la barra de
// moderación. comunidadService es un stub; la navegación es real (MemoryRouter).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ok, falla } from '../../../test/helpers';

vi.mock('../../../components/Layout/DashboardLayout', () => ({ default: ({ children }) => <main>{children}</main> }));

const api = vi.hoisted(() => ({
  getPostsByForo: vi.fn(), createPost: vi.fn(),
  getPost: vi.fn(), votarPost: vi.fn(), responderPost: vi.fn(),
  getPregunta: vi.fn(), responderPregunta: vi.fn(), reportarPregunta: vi.fn(),
  ocultarPublicacion: vi.fn(), eliminarPublicacion: vi.fn(),
}));
vi.mock('../../../services/comunidadService', () => api);

import ForoDetalle from './ForoDetalle';
import PostDetalle from './PostDetalle';

function montar(entrada) {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[entrada]}>
      <Routes>
        <Route path="/dashboard/comunidad" element={<p>Inicio comunidad</p>} />
        <Route path="/dashboard/comunidad/foro/:id" element={<ForoDetalle />} />
        <Route path="/dashboard/comunidad/post/:id" element={<PostDetalle />} />
        <Route path="/dashboard/comunidad/autor/:id" element={<p>Ficha del autor</p>} />
      </Routes>
    </MemoryRouter>,
  );
  return user;
}

const FORO = { id: 'f1', icon: '🩺', nombre: 'Salud', posts: 1 };
const POST = { id: 'p1', titulo: '¿Vale la pena enfermería?', preview: 'Estoy dudando…', votos: 4, respuestas: 2, autor_display: 'Ana', ini: 'A', time: 'hace 1 h' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  api.ocultarPublicacion.mockResolvedValue(ok());
  api.eliminarPublicacion.mockResolvedValue(ok());
});
afterEach(() => vi.restoreAllMocks());

describe('ForoDetalle', () => {
  const entrar = () => montar({ pathname: '/dashboard/comunidad/foro/f1', state: { foro: FORO } });

  it('lista los posts del foro y cambia el orden', async () => {
    api.getPostsByForo.mockResolvedValue(ok([POST]));
    const user = entrar();
    expect(await screen.findByText(POST.titulo)).toBeInTheDocument();
    expect(screen.getByText('Salud')).toBeInTheDocument();
    expect(screen.getByText('1 posts')).toBeInTheDocument();
    expect(api.getPostsByForo).toHaveBeenCalledWith('f1', 'recientes');
    await user.click(screen.getByRole('button', { name: 'Más votados' }));
    await waitFor(() => expect(api.getPostsByForo).toHaveBeenLastCalledWith('f1', 'votados'));
  });

  // Comportamiento actual (posible defecto): el ▲ del listado no detiene el
  // clic, así que votar también abre el post. Se deja documentado para
  // reportarlo; si se corrige, esta prueba debe cambiar a "se queda en el foro".
  it('votar en el listado también abre el post (el clic burbujea a la tarjeta)', async () => {
    api.getPostsByForo.mockResolvedValue(ok([POST]));
    api.getPost.mockResolvedValue(ok({ ...POST, contenido: 'Cuerpo del post', respuestas: [] }));
    const user = entrar();
    await screen.findByText(POST.titulo);
    await user.click(screen.getByRole('button', { name: '▲' }));
    expect(await screen.findByText('Cuerpo del post')).toBeInTheDocument();
  });

  it('foro vacío invita a publicar; publicar agrega el post arriba', async () => {
    api.getPostsByForo.mockResolvedValue(ok([]));
    api.createPost.mockResolvedValueOnce(falla('Texto ofensivo')).mockResolvedValueOnce(ok({ ...POST, id: 'p9', titulo: 'Nuevo tema' }));
    const user = entrar();
    await user.click(await screen.findByRole('button', { name: 'Crear el primer post' }));
    await user.type(screen.getByPlaceholderText('¿Cuál es tu pregunta o tema?'), 'Nuevo tema');
    await user.type(screen.getByPlaceholderText('Explica más tu pregunta o tema…'), 'Detalle');
    await user.click(screen.getByLabelText('Publicar como anónimo'));
    await user.click(screen.getByRole('button', { name: 'Publicar post' }));
    expect(await screen.findByText('Texto ofensivo')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Publicar post' }));
    expect(await screen.findByText('Nuevo tema')).toBeInTheDocument();
    expect(api.createPost).toHaveBeenLastCalledWith('f1', { titulo: 'Nuevo tema', contenido: 'Detalle', anonimo: true });
    expect(screen.queryByText('Nuevo post')).not.toBeInTheDocument();
  });

  it('sin state usa el id como nombre; volver lleva a Comunidad', async () => {
    api.getPostsByForo.mockResolvedValue(ok([]));
    const user = montar('/dashboard/comunidad/foro/general');
    expect(await screen.findByText('general')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '← Comunidad · Foros' }));
    expect(screen.getByText('Inicio comunidad')).toBeInTheDocument();
  });

  it('abrir un post navega a su detalle', async () => {
    api.getPostsByForo.mockResolvedValue(ok([POST]));
    api.getPost.mockResolvedValue(ok({ ...POST, contenido: 'Cuerpo del post', respuestas: [] }));
    const user = entrar();
    await user.click(await screen.findByText(POST.titulo));
    expect(await screen.findByText('Cuerpo del post')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '← Comunidad · Salud' })).toBeInTheDocument();
  });

  it('moderación: ocultar quita el post de la lista solo si se confirma', async () => {
    api.getPostsByForo.mockResolvedValue(ok([{ ...POST, autor_id: 'u-7' }]));
    const user = entrar();
    await screen.findByText(POST.titulo);
    window.confirm.mockReturnValueOnce(false);
    await user.click(screen.getByRole('button', { name: /Ocultar/ }));
    expect(api.ocultarPublicacion).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: /Ocultar/ }));
    await waitFor(() => expect(screen.queryByText(POST.titulo)).not.toBeInTheDocument());
    expect(api.ocultarPublicacion).toHaveBeenCalledWith('post', 'p1');
  });

  it('moderación: eliminar y ver autor', async () => {
    api.getPostsByForo.mockResolvedValue(ok([{ ...POST, autor_id: 'u-7' }]));
    const user = entrar();
    await screen.findByText(POST.titulo);
    await user.click(screen.getByRole('button', { name: /Eliminar/ }));
    await waitFor(() => expect(api.eliminarPublicacion).toHaveBeenCalledWith('post', 'p1'));
  });
});

describe('PostDetalle', () => {
  const DETALLE = {
    titulo: 'Duda sobre becas', contenido: 'Cuerpo', autor_display: 'Luis', ini: 'L', time: 'ayer', votos: 3, mi_voto: null,
    respuestas: [{ id: 'r1', autor_display: 'Sara', ini: 'S', time: 'hoy', texto: 'Mira el ICETEX', votos: 2, mejor: true }],
  };

  it('muestra el post, su respuesta destacada y permite votar', async () => {
    api.getPost.mockResolvedValue(ok(DETALLE));
    api.votarPost.mockResolvedValueOnce(ok({ votos: 4, mi_voto: 'up' })).mockResolvedValueOnce(falla('x'));
    const user = montar('/dashboard/comunidad/post/p1');
    expect(await screen.findByText('Duda sobre becas')).toBeInTheDocument();
    expect(screen.getByText('★ Mejor respuesta')).toBeInTheDocument();
    expect(screen.getByText('1 respuesta')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '▲' }));
    expect(await screen.findByText('4')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '▼' }));
    expect(api.votarPost).toHaveBeenLastCalledWith('p1', 'down');
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('responder agrega la respuesta y limpia el campo', async () => {
    api.getPost.mockResolvedValue(ok({ ...DETALLE, respuestas: [] }));
    api.responderPost.mockResolvedValue(ok({ id: 'r2', autor_display: 'Anónimo', ini: '?', time: 'ahora', texto: 'Yo también', votos: 0 }));
    const user = montar('/dashboard/comunidad/post/p1');
    expect(await screen.findByText('Sé el primero en responder.')).toBeInTheDocument();
    const publicar = screen.getByRole('button', { name: 'Publicar →' });
    expect(publicar).toBeDisabled();
    await user.type(screen.getByPlaceholderText('Escribe tu respuesta aquí…'), '  Yo también ');
    await user.click(screen.getByLabelText('Responder como anónimo'));
    await user.click(publicar);
    expect(await screen.findByText('Yo también')).toBeInTheDocument();
    expect(api.responderPost).toHaveBeenCalledWith('p1', { contenido: 'Yo también', anonimo: true });
    expect(screen.getByPlaceholderText('Escribe tu respuesta aquí…')).toHaveValue('');
  });

  it('una pregunta se puede reportar y responder; no tiene votos', async () => {
    api.getPregunta.mockResolvedValue(ok({ title: '¿Qué es el SENA?', body: 'Ayuda', name: 'Pepe', resuelta: true, es_autor: false, respuestas: [] }));
    api.reportarPregunta.mockResolvedValue(ok());
    api.responderPregunta.mockResolvedValue(falla('x'));
    const user = montar({ pathname: '/dashboard/comunidad/post/q1', state: { tipo: 'pregunta' } });
    expect(await screen.findByText('¿Qué es el SENA?')).toBeInTheDocument();
    expect(screen.getByText('Resuelta ✓')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '▲' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '🚩 Reportar' }));
    expect(await screen.findByRole('button', { name: 'Reportada' })).toBeDisabled();

    await user.type(screen.getByPlaceholderText('Escribe tu respuesta aquí…'), 'Es una entidad');
    await user.click(screen.getByRole('button', { name: 'Publicar →' }));
    await waitFor(() => expect(api.responderPregunta).toHaveBeenCalledWith('q1', { contenido: 'Es una entidad', anonimo: false }));
    expect(screen.getByPlaceholderText('Escribe tu respuesta aquí…')).toHaveValue('Es una entidad');
  });

  it('si el reporte falla muestra el motivo', async () => {
    api.getPregunta.mockResolvedValue(ok({ title: 'Q', es_autor: false, respuestas: [] }));
    api.reportarPregunta.mockResolvedValue(falla('Ya la reportaste'));
    const user = montar({ pathname: '/dashboard/comunidad/post/q1', state: { tipo: 'pregunta' } });
    await user.click(await screen.findByRole('button', { name: '🚩 Reportar' }));
    expect(await screen.findByText('Ya la reportaste')).toBeInTheDocument();
  });

  it('post inexistente ofrece volver', async () => {
    api.getPost.mockResolvedValue(falla('404'));
    const user = montar('/dashboard/comunidad/post/zzz');
    expect(await screen.findByText('Post no encontrado.')).toBeInTheDocument();
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Inicio comunidad')).toBeInTheDocument();
  });

  it('el moderador puede ver al autor real', async () => {
    api.getPost.mockResolvedValue(ok({ ...DETALLE, autor_id: 'u-7' }));
    const user = montar('/dashboard/comunidad/post/p1');
    const barra = (await screen.findByRole('button', { name: /Ver autor/ })).parentElement;
    await user.click(within(barra).getByRole('button', { name: /Ver autor/ }));
    expect(screen.getByText('Ficha del autor')).toBeInTheDocument();
  });
});
