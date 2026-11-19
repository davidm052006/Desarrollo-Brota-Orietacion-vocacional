// Contrato HTTP de los servicios del frontend: cada función pega a la URL y
// método correctos, manda el token de la sesión, devuelve el `data` del
// backend y, si la red falla, responde un error legible en vez de lanzar.
// `fetch` es un stub y el cliente de Supabase un fake (sin red real).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  verifyOtp: vi.fn(),
  updateUser: vi.fn(),
}));
vi.mock('../config/supabase', () => ({ supabase: { auth } }));

import * as admin from './adminService';
import * as institucion from './institucionService';
import * as comunidad from './comunidadService';
import * as perfil from './perfilService';
import * as rutas from './rutasService';
import * as contacto from './contactoService';
import * as programas from './programasService';
import * as authService from './authService';
import { parseResponse } from './apiClient';

const respuesta = (status, body) => ({ ok: status < 400, status, json: async () => body });
const ultimaLlamada = () => {
  const [url, opciones = {}] = fetch.mock.calls.at(-1);
  return { url, metodo: opciones.method ?? 'GET', body: opciones.body && JSON.parse(opciones.body), headers: opciones.headers };
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta(200, { data: 'ok', meta: { total: 1 } })));
  auth.getSession.mockResolvedValue({ data: { session: { access_token: 'tok-123' } } });
  Object.values(auth).forEach((fn) => fn.mockReset());
  auth.getSession.mockResolvedValue({ data: { session: { access_token: 'tok-123' } } });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// [nombre, llamada, URL esperada (sin API_URL), método, body esperado]
const CASOS = {
  adminService: [
    ['getStats', () => admin.getStats(), '/api/admin/stats', 'GET'],
    ['getAnalytics', () => admin.getAnalytics(), '/api/admin/analytics', 'GET'],
    ['getUsuarios (defaults)', () => admin.getUsuarios(), '/api/admin/usuarios?pagina=1&limite=10', 'GET'],
    ['getUsuarios (filtros)', () => admin.getUsuarios({ pagina: 2, busqueda: 'ana', rol: 'admin' }), '/api/admin/usuarios?pagina=2&limite=10&busqueda=ana&rol=admin', 'GET'],
    ['createUsuario', () => admin.createUsuario({ email: 'a@b.co' }), '/api/admin/usuarios', 'POST', { email: 'a@b.co' }],
    ['updateUsuario', () => admin.updateUsuario('u1', { nombre: 'Ana' }), '/api/admin/usuarios/u1', 'PATCH', { nombre: 'Ana' }],
    ['deleteUsuario', () => admin.deleteUsuario('u1'), '/api/admin/usuarios/u1', 'DELETE'],
    ['bloquearUsuario', () => admin.bloquearUsuario('u1', { horas: 24 }), '/api/admin/usuarios/u1/bloqueo', 'PATCH', { horas: 24 }],
    ['getCatalogoPermisos', () => admin.getCatalogoPermisos(), '/api/admin/permisos/catalogo', 'GET'],
    ['actualizarPermisosUsuario', () => admin.actualizarPermisosUsuario('u1', { foros: true }), '/api/admin/usuarios/u1/permisos', 'PATCH'],
    ['getInstituciones', () => admin.getInstituciones({ busqueda: 'sena' }), '/api/admin/instituciones?pagina=1&limite=10&busqueda=sena', 'GET'],
    ['createInstitucion', () => admin.createInstitucion({ nombre: 'X' }), '/api/admin/instituciones', 'POST', { nombre: 'X' }],
    ['updateInstitucion', () => admin.updateInstitucion(3, { nombre: 'Y' }), '/api/admin/instituciones/3', 'PATCH', { nombre: 'Y' }],
    ['deleteInstitucion', () => admin.deleteInstitucion(3), '/api/admin/instituciones/3', 'DELETE'],
    ['getProgramas', () => admin.getProgramas(), '/api/admin/programas?pagina=1&limite=10', 'GET'],
    ['createPrograma', () => admin.createPrograma({ nombre: 'P' }), '/api/admin/programas', 'POST', { nombre: 'P' }],
    ['updatePrograma', () => admin.updatePrograma(4, { nombre: 'Q' }), '/api/admin/programas/4', 'PATCH', { nombre: 'Q' }],
    ['deletePrograma', () => admin.deletePrograma(4), '/api/admin/programas/4', 'DELETE'],
    ['getConvocatorias', () => admin.getConvocatorias({ busqueda: 'beca' }), '/api/admin/convocatorias?pagina=1&limite=10&busqueda=beca', 'GET'],
    ['createConvocatoria', () => admin.createConvocatoria({ titulo: 'B' }), '/api/admin/convocatorias', 'POST', { titulo: 'B' }],
    ['updateConvocatoria', () => admin.updateConvocatoria(5, { titulo: 'C' }), '/api/admin/convocatorias/5', 'PATCH', { titulo: 'C' }],
    ['deleteConvocatoria', () => admin.deleteConvocatoria(5), '/api/admin/convocatorias/5', 'DELETE'],
    ['getCuestionarios', () => admin.getCuestionarios(), '/api/admin/cuestionarios', 'GET'],
    ['createCuestionario', () => admin.createCuestionario({ titulo: 'T' }), '/api/admin/cuestionarios', 'POST', { titulo: 'T' }],
    ['updateCuestionario', () => admin.updateCuestionario(6, { activo: false }), '/api/admin/cuestionarios/6', 'PATCH', { activo: false }],
    ['deleteCuestionario', () => admin.deleteCuestionario(6), '/api/admin/cuestionarios/6', 'DELETE'],
    ['getPreguntas', () => admin.getPreguntas({ cuestionario_id: 6 }), '/api/admin/preguntas?', 'GET'],
    ['createPregunta', () => admin.createPregunta({ texto: '¿?' }), '/api/admin/preguntas', 'POST', { texto: '¿?' }],
    ['updatePregunta', () => admin.updatePregunta(7, { texto: '¡!' }), '/api/admin/preguntas/7', 'PATCH', { texto: '¡!' }],
    ['deletePregunta', () => admin.deletePregunta(7), '/api/admin/preguntas/7', 'DELETE'],
    ['getPreguntasComunidad', () => admin.getPreguntasComunidad(), '/api/admin/preguntas-comunidad', 'GET'],
    ['deletePreguntaComunidad', () => admin.deletePreguntaComunidad('q1'), '/api/admin/preguntas-comunidad/q1', 'DELETE'],
    ['getSincronizacionEstado', () => admin.getSincronizacionEstado(), '/api/admin/sincronizacion/estado', 'GET'],
    ['ejecutarSincronizacion', () => admin.ejecutarSincronizacion(), '/api/admin/sincronizacion/ejecutar', 'POST'],
  ],
  institucionService: [
    ['getMisProgramas', () => institucion.getMisProgramas(), '/api/institucion/programas', 'GET'],
    ['actualizarMiPrograma', () => institucion.actualizarMiPrograma(1, { cupos: 30 }), '/api/institucion/programas/1', 'PATCH', { cupos: 30 }],
    ['getUsuarios', () => institucion.getUsuarios({ busqueda: 'luis' }), '/api/institucion/usuarios?pagina=1&limite=10&busqueda=luis', 'GET'],
    ['createUsuario', () => institucion.createUsuario({ email: 'e@x.co' }), '/api/institucion/usuarios', 'POST', { email: 'e@x.co' }],
    ['deleteUsuario', () => institucion.deleteUsuario('u9'), '/api/institucion/usuarios/u9', 'DELETE'],
    ['getCuestionarios', () => institucion.getCuestionarios(), '/api/institucion/cuestionarios', 'GET'],
    ['createCuestionario', () => institucion.createCuestionario({ titulo: 'Mío' }), '/api/institucion/cuestionarios', 'POST', { titulo: 'Mío' }],
    ['actualizarCuestionario', () => institucion.actualizarCuestionario(2, { titulo: 'Otro' }), '/api/institucion/cuestionarios/2', 'PATCH', { titulo: 'Otro' }],
    ['eliminarCuestionario', () => institucion.eliminarCuestionario(2), '/api/institucion/cuestionarios/2', 'DELETE'],
    ['getPreguntas', () => institucion.getPreguntas(2), '/api/institucion/preguntas?cuestionario_id=2', 'GET'],
    ['crearPregunta', () => institucion.crearPregunta({ texto: 'a' }), '/api/institucion/preguntas', 'POST', { texto: 'a' }],
    ['actualizarPregunta', () => institucion.actualizarPregunta(8, { texto: 'b' }), '/api/institucion/preguntas/8', 'PATCH', { texto: 'b' }],
    ['eliminarPregunta', () => institucion.eliminarPregunta(8), '/api/institucion/preguntas/8', 'DELETE'],
    ['getAnalytics', () => institucion.getAnalytics(), '/api/institucion/analytics', 'GET'],
  ],
  comunidadService: [
    ['getForos', () => comunidad.getForos(), '/api/comunidad/foros', 'GET'],
    ['getPostsByForo (orden por defecto)', () => comunidad.getPostsByForo('f1'), '/api/comunidad/foros/f1/posts?orden=recientes', 'GET'],
    ['getPostsByForo (populares)', () => comunidad.getPostsByForo('f1', 'populares'), '/api/comunidad/foros/f1/posts?orden=populares', 'GET'],
    ['createPost', () => comunidad.createPost('f1', { titulo: 't' }), '/api/comunidad/foros/f1/posts', 'POST', { titulo: 't' }],
    ['getPost', () => comunidad.getPost('p1'), '/api/comunidad/posts/p1', 'GET'],
    ['votarPost', () => comunidad.votarPost('p1', 'up'), '/api/comunidad/posts/p1/votar', 'POST', { direccion: 'up' }],
    ['responderPost', () => comunidad.responderPost('p1', { contenido: 'c' }), '/api/comunidad/posts/p1/respuestas', 'POST', { contenido: 'c' }],
    ['getHistorias', () => comunidad.getHistorias(), '/api/comunidad/historias', 'GET'],
    ['getHistoria', () => comunidad.getHistoria('h1'), '/api/comunidad/historias/h1', 'GET'],
    ['crearHistoria', () => comunidad.crearHistoria({ titulo: 'h' }), '/api/comunidad/historias', 'POST', { titulo: 'h' }],
    ['toggleLikeHistoria', () => comunidad.toggleLikeHistoria('h1'), '/api/comunidad/historias/h1/like', 'POST', {}],
    ['getPreguntas', () => comunidad.getPreguntas(), '/api/comunidad/preguntas', 'GET'],
    ['getPregunta', () => comunidad.getPregunta('q1'), '/api/comunidad/preguntas/q1', 'GET'],
    ['crearPregunta', () => comunidad.crearPregunta({ titulo: 'q' }), '/api/comunidad/preguntas', 'POST', { titulo: 'q' }],
    ['responderPregunta', () => comunidad.responderPregunta('q1', { contenido: 'r' }), '/api/comunidad/preguntas/q1/respuestas', 'POST', { contenido: 'r' }],
    ['marcarMejorRespuesta', () => comunidad.marcarMejorRespuesta('q1', 'r1'), '/api/comunidad/preguntas/q1/respuestas/r1/mejor', 'PATCH'],
    ['reportarPregunta', () => comunidad.reportarPregunta('q1', 'spam'), '/api/comunidad/preguntas/q1/reportar', 'POST', { motivo: 'spam' }],
    ['getConvocatorias', () => comunidad.getConvocatorias(), '/api/comunidad/convocatorias', 'GET'],
    ['getConvocatoria', () => comunidad.getConvocatoria(9), '/api/comunidad/convocatorias/9', 'GET'],
    ['getFeedReciente', () => comunidad.getFeedReciente(), '/api/comunidad/feed', 'GET'],
    ['getNotificaciones', () => comunidad.getNotificaciones(), '/api/comunidad/notificaciones', 'GET'],
    ['ocultarPublicacion', () => comunidad.ocultarPublicacion('post', 'p1'), '/api/comunidad/moderacion/post/p1/ocultar', 'PATCH'],
    ['eliminarPublicacion', () => comunidad.eliminarPublicacion('post', 'p1'), '/api/comunidad/moderacion/post/p1', 'DELETE'],
    ['getInfoAutor', () => comunidad.getInfoAutor('u1'), '/api/comunidad/moderacion/autor/u1', 'GET'],
  ],
  perfilService: [
    ['obtenerCuestionario', () => perfil.obtenerCuestionario(), '/api/perfil/cuestionario', 'GET'],
    ['guardarResultado', () => perfil.guardarResultado('pu1', 'c1', [{ p: 1 }]), '/api/perfil/resultado', 'POST',
      { perfil_usuario_id: 'pu1', cuestionario_id: 'c1', respuestas: [{ p: 1 }] }],
    ['obtenerResultado', () => perfil.obtenerResultado('pu1'), '/api/perfil/resultado/pu1', 'GET'],
    ['obtenerRecomendaciones', () => perfil.obtenerRecomendaciones('r1'), '/api/perfil/recomendaciones/r1', 'GET'],
    ['marcarRecomendacionVista', () => perfil.marcarRecomendacionVista('rec1'), '/api/perfil/recomendaciones/rec1/vista', 'PATCH'],
    ['eliminarResultado', () => perfil.eliminarResultado('pu1'), '/api/perfil/resultado/pu1', 'DELETE'],
    ['obtenerPerfil', () => perfil.obtenerPerfil('u1'), '/api/perfil/u1', 'GET'],
    ['actualizarPerfil', () => perfil.actualizarPerfil('u1', { ciudad: 'Cali' }), '/api/perfil/u1', 'PATCH', { ciudad: 'Cali' }],
    ['actualizarBroti', () => perfil.actualizarBroti('u1', { color: 'verde' }), '/api/perfil/u1/broti', 'PATCH', { broti_config: { color: 'verde' } }],
  ],
  rutasService: [
    ['getAreasDisponibles', () => rutas.getAreasDisponibles(), '/api/rutas', 'GET'],
    ['getRutaPorArea', () => rutas.getRutaPorArea('salud'), '/api/rutas/salud', 'GET'],
  ],
};

for (const [servicio, casos] of Object.entries(CASOS)) {
  describe(servicio, () => {
    it.each(casos)('%s pega a la ruta correcta con el token', async (_n, llamar, url, metodo, body) => {
      const r = await llamar();
      const llamada = ultimaLlamada();
      expect(llamada.url).toContain(url);
      expect(llamada.metodo).toBe(metodo);
      if (body !== undefined) expect(llamada.body).toEqual(body);
      expect(llamada.headers.Authorization).toBe('Bearer tok-123');
      expect(r).toEqual({ success: true, data: 'ok', meta: { total: 1 } });
    });

    it.each(casos)('%s no lanza si la red falla', async (_n, llamar) => {
      fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
      const r = await llamar();
      expect(r.success).toBe(false);
      expect(r.error).toMatch(/^Error (de conexión|al )/);
    });
  });
}

describe('institucionService.createUsuariosMasivo', () => {
  const lote = [{ email: 'e@x.co' }];

  it('manda el lote en una sola request y devuelve los resultados por fila', async () => {
    fetch.mockResolvedValueOnce(respuesta(200, { resultados: [{ success: true }] }));
    expect(await institucion.createUsuariosMasivo(lote)).toEqual({ success: true, resultados: [{ success: true }] });
    expect(ultimaLlamada()).toMatchObject({ metodo: 'POST', body: { usuarios: lote } });
    expect(ultimaLlamada().url).toContain('/api/institucion/usuarios/masivo');
  });

  it('error del servidor o de red siempre trae resultados vacíos', async () => {
    fetch.mockResolvedValueOnce(respuesta(413, { message: 'Máximo 500 filas' }));
    expect(await institucion.createUsuariosMasivo(lote)).toEqual({ success: false, error: 'Máximo 500 filas', resultados: [] });
    fetch.mockResolvedValueOnce({ ok: false, status: 502, json: () => Promise.reject(new SyntaxError()) });
    expect((await institucion.createUsuariosMasivo(lote)).error).toBe('Error del servidor (502)');
    fetch.mockRejectedValueOnce(new TypeError('x'));
    expect(await institucion.createUsuariosMasivo(lote)).toEqual({ success: false, error: 'Error de conexión con el servidor', resultados: [] });
  });
});

describe('apiClient.parseResponse', () => {
  it('sin sesión no manda Authorization', async () => {
    auth.getSession.mockResolvedValueOnce({ data: { session: null } });
    await admin.getStats();
    expect(ultimaLlamada().headers).toEqual({ 'Content-Type': 'application/json' });
  });

  it('usa error, luego message, luego un texto con el status', async () => {
    expect(await parseResponse(respuesta(400, { error: 'malo', message: 'm' }))).toMatchObject({ success: false, error: 'malo', status: 400 });
    expect(await parseResponse(respuesta(404, { message: 'no existe' }))).toMatchObject({ error: 'no existe' });
    const sinJson = { ok: false, status: 502, json: async () => { throw new SyntaxError('html'); } };
    expect(await parseResponse(sinJson)).toMatchObject({ error: 'Error del servidor (502)' });
  });

  it('BLOQUEADO avisa a la app con un evento cuenta-bloqueada', async () => {
    const oyente = vi.fn();
    window.addEventListener('cuenta-bloqueada', oyente);
    const r = await parseResponse(respuesta(403, { error: 'BLOQUEADO', hasta: '2026-12-01' }));
    window.removeEventListener('cuenta-bloqueada', oyente);
    expect(r).toMatchObject({ success: false, hasta: '2026-12-01' });
    expect(oyente).toHaveBeenCalledTimes(1);
    expect(oyente.mock.calls[0][0].detail).toEqual({ hasta: '2026-12-01' });
  });

  it('un error distinto no dispara el evento', async () => {
    const oyente = vi.fn();
    window.addEventListener('cuenta-bloqueada', oyente);
    await parseResponse(respuesta(403, { error: 'Sin permiso' }));
    window.removeEventListener('cuenta-bloqueada', oyente);
    expect(oyente).not.toHaveBeenCalled();
  });
});

describe('contactoService', () => {
  const FORM = { nombre: 'Ana', email: 'a@b.co', telefono: '300', asunto: 'Hola', mensaje: 'Quiero info' };

  it('enviarContacto es público (sin token) y solo manda los campos del formulario', async () => {
    expect(await contacto.enviarContacto({ ...FORM, extra: 'x' })).toEqual({ success: true });
    const l = ultimaLlamada();
    expect(l.url).toContain('/api/contacto');
    expect(l.body).toEqual(FORM);
    expect(l.headers.Authorization).toBeUndefined();
    expect(auth.getSession).not.toHaveBeenCalled();
  });

  it('enviarContacto muestra el mensaje del backend o uno genérico', async () => {
    fetch.mockResolvedValueOnce(respuesta(429, { message: 'Muchos envíos' }));
    expect(await contacto.enviarContacto(FORM)).toEqual({ success: false, error: 'Muchos envíos' });
    fetch.mockResolvedValueOnce(respuesta(500, {}));
    expect(await contacto.enviarContacto(FORM)).toEqual({ success: false, error: 'Error del servidor.' });
    fetch.mockRejectedValueOnce(new TypeError('x'));
    expect((await contacto.enviarContacto(FORM)).error).toBe('Error de conexión. Intenta de nuevo.');
  });

  it('getContactos filtra por estado solo si viene', async () => {
    expect(await contacto.getContactos()).toEqual({ success: true, data: 'ok', meta: { total: 1 } });
    expect(ultimaLlamada().url).toMatch(/\/api\/admin\/contactos\?pagina=1&limite=20$/);
    await contacto.getContactos({ estado: 'nuevo' });
    expect(ultimaLlamada().url).toContain('estado=nuevo');
    fetch.mockResolvedValueOnce(respuesta(403, { message: 'No' }));
    expect(await contacto.getContactos()).toEqual({ success: false, error: 'No' });
    fetch.mockRejectedValueOnce(new TypeError('x'));
    expect((await contacto.getContactos()).error).toBe('Error de conexión.');
  });

  it('actualizarContacto hace PATCH y maneja errores', async () => {
    expect(await contacto.actualizarContacto(1, { estado: 'leido' })).toEqual({ success: true });
    expect(ultimaLlamada()).toMatchObject({ metodo: 'PATCH', body: { estado: 'leido' } });
    fetch.mockResolvedValueOnce(respuesta(400, { message: 'Estado inválido' }));
    expect(await contacto.actualizarContacto(1, {})).toEqual({ success: false, error: 'Estado inválido' });
    fetch.mockRejectedValueOnce(new TypeError('x'));
    expect((await contacto.actualizarContacto(1, {})).error).toBe('Error de conexión.');
  });
});

describe('programasService', () => {
  it('omite area "todos" y recorta la búsqueda', async () => {
    fetch.mockResolvedValueOnce(respuesta(200, { success: true, data: [1], total: 1 }));
    expect(await programas.obtenerProgramas({ area: 'todos', search: '  medicina ' })).toEqual({ success: true, data: [1], total: 1 });
    const url = new URL(ultimaLlamada().url, 'http://x');
    expect(url.searchParams.get('area')).toBeNull();
    expect(url.searchParams.get('search')).toBe('medicina');
    expect(url.searchParams.get('limit')).toBe('24');

    await programas.obtenerProgramas({ area: 'salud', search: '   ' });
    const url2 = new URL(ultimaLlamada().url, 'http://x');
    expect(url2.searchParams.get('area')).toBe('salud');
    expect(url2.searchParams.has('search')).toBe(false);
  });

  it('si la red falla devuelve listas vacías para no romper la vista', async () => {
    fetch.mockRejectedValueOnce(new Error('caído'));
    expect(await programas.obtenerProgramas()).toEqual({ success: false, error: 'caído', data: [], total: 0 });
    fetch.mockRejectedValueOnce(new Error('caído'));
    expect(await programas.obtenerEstadisticas()).toEqual({ success: false, error: 'caído', total: 0, areas: [] });
  });

  it('obtenerEstadisticas devuelve el json tal cual', async () => {
    fetch.mockResolvedValueOnce(respuesta(200, { total: 5, areas: ['a'] }));
    expect(await programas.obtenerEstadisticas()).toEqual({ total: 5, areas: ['a'] });
    expect(ultimaLlamada().url).toContain('/api/programas/stats');
  });
});

describe('authService', () => {
  it('loginWithEmail traduce el error de Supabase', async () => {
    auth.signInWithPassword.mockResolvedValueOnce({ error: null });
    expect(await authService.loginWithEmail('a@b.co', 'x')).toEqual({ success: true });
    auth.signInWithPassword.mockResolvedValueOnce({ error: { message: 'Invalid login credentials' } });
    expect(await authService.loginWithEmail('a@b.co', 'x')).toEqual({ success: false, error: 'Correo o contraseña incorrectos.' });
    auth.signInWithPassword.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const r = await authService.loginWithEmail('a@b.co', 'x');
    expect(r.success).toBe(false);
    expect(r.error).not.toMatch(/failed to fetch/i);
  });

  describe('signUpWithEmail', () => {
    it('crea el perfil en el backend con el token de la nueva sesión', async () => {
      auth.signUp.mockResolvedValueOnce({ data: { session: { access_token: 'nuevo' } }, error: null });
      fetch.mockResolvedValueOnce(respuesta(201, { success: true }));
      expect(await authService.signUpWithEmail('a@b.co', 'Clave123', 'Ana', 'Ruiz', { ciudad: 'Cali' })).toEqual({ success: true });
      const l = ultimaLlamada();
      expect(l.url).toContain('/api/auth/register-perfil');
      expect(l.headers.Authorization).toBe('Bearer nuevo');
      expect(l.body).toEqual({ nombre: 'Ana', apellido: 'Ruiz', ciudad: 'Cali' });
    });

    it('sin sesión pide confirmar el correo y no llama al backend', async () => {
      auth.signUp.mockResolvedValueOnce({ data: { session: null }, error: null });
      const r = await authService.signUpWithEmail('a@b.co', 'Clave123', 'Ana', 'Ruiz');
      expect(r.error).toMatch(/confirmar tu cuenta/);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('propaga errores de Supabase, del backend y de red', async () => {
      auth.signUp.mockResolvedValueOnce({ data: null, error: { message: 'User already registered' } });
      expect((await authService.signUpWithEmail('a', 'b', 'c', 'd')).success).toBe(false);

      auth.signUp.mockResolvedValue({ data: { session: { access_token: 't' } }, error: null });
      fetch.mockResolvedValueOnce(respuesta(400, { message: 'Ciudad inválida' }));
      expect(await authService.signUpWithEmail('a', 'b', 'c', 'd')).toEqual({ success: false, error: 'Ciudad inválida' });
      fetch.mockResolvedValueOnce(respuesta(500, {}));
      expect((await authService.signUpWithEmail('a', 'b', 'c', 'd')).error).toBe('Error al crear el perfil.');
      fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
      expect((await authService.signUpWithEmail('a', 'b', 'c', 'd')).success).toBe(false);
    });
  });

  it('sendPasswordReset: éxito, error y excepción', async () => {
    auth.resetPasswordForEmail.mockResolvedValueOnce({ error: null });
    expect(await authService.sendPasswordReset('a@b.co')).toEqual({ success: true });
    auth.resetPasswordForEmail.mockResolvedValueOnce({ error: { message: 'x' } });
    expect((await authService.sendPasswordReset('a@b.co')).success).toBe(false);
    auth.resetPasswordForEmail.mockRejectedValueOnce('texto suelto');
    expect((await authService.sendPasswordReset('a@b.co')).success).toBe(false);
  });

  describe('verifyOtpAndUpdatePassword', () => {
    it('verifica el código de recuperación y luego cambia la clave', async () => {
      auth.verifyOtp.mockResolvedValueOnce({ error: null });
      auth.updateUser.mockResolvedValueOnce({ error: null });
      expect(await authService.verifyOtpAndUpdatePassword('a@b.co', '123456', 'Nueva123')).toEqual({ success: true });
      expect(auth.verifyOtp).toHaveBeenCalledWith({ email: 'a@b.co', token: '123456', type: 'recovery' });
      expect(auth.updateUser).toHaveBeenCalledWith({ password: 'Nueva123' });
    });

    it('con código malo no intenta cambiar la clave', async () => {
      auth.verifyOtp.mockResolvedValueOnce({ error: { message: 'Token has expired' } });
      const r = await authService.verifyOtpAndUpdatePassword('a@b.co', '000000', 'Nueva123');
      expect(r.error).toBe('Código incorrecto o expirado. Verifica e intenta de nuevo.');
      expect(auth.updateUser).not.toHaveBeenCalled();
    });

    it('falla del updateUser o excepción', async () => {
      auth.verifyOtp.mockResolvedValue({ error: null });
      auth.updateUser.mockResolvedValueOnce({ error: { message: 'weak' } });
      expect((await authService.verifyOtpAndUpdatePassword('a', 'b', 'c')).success).toBe(false);
      auth.updateUser.mockRejectedValueOnce(new Error('boom'));
      expect((await authService.verifyOtpAndUpdatePassword('a', 'b', 'c')).success).toBe(false);
    });
  });

  it('updatePassword: éxito, error y excepción', async () => {
    auth.updateUser.mockResolvedValueOnce({ error: null });
    expect(await authService.updatePassword('Nueva123')).toEqual({ success: true });
    auth.updateUser.mockResolvedValueOnce({ error: { message: 'x' } });
    expect((await authService.updatePassword('Nueva123')).success).toBe(false);
    auth.updateUser.mockRejectedValueOnce(new Error('boom'));
    expect((await authService.updatePassword('Nueva123')).success).toBe(false);
  });
});
