// Semana 4 · Brayan · Capa Front (contratos que consume la interfaz)
//
// Prueba desde HTTP (supertest + server.js real) los dos endpoints de
// comunidad que usa el Dashboard y la barra de moderación:
//   GET   /api/comunidad/feed                          → FeedReciente.jsx
//   PATCH /api/comunidad/moderacion/:tipo/:id/ocultar  → ModeracionBar (primitivos.jsx)
// y verifica los campos y errores que el frontend realmente lee:
//   - parseResponse (services/apiClient.js) usa body.error || body.message
//   - FeedReciente usa id, tipo, titulo, autor, time, link y linkState
//
// Supabase está simulado (fake con stubs programables): ningún test lee ni
// modifica datos reales. Las consultas de lista se responden con una "tabla"
// en memoria que aplica los filtros .eq() que pidió el controlador, para
// comprobar el estado (qué filas salen) y no solo las llamadas.
const request = require('supertest');
const { crearSupabaseFake } = require('../helpers/supabaseFake');

// Cada test arma un fake nuevo; server.js ve siempre el actual.
const mockEstado = { db: null };
jest.mock('../../src/config/supabase', () => new Proxy({}, { get: (_t, k) => mockEstado.db[k] }));

const app = require('../../src/server');

const TOKEN = 'Bearer token-de-prueba';
let db;

beforeEach(() => {
  db = crearSupabaseFake();
  mockEstado.db = db;
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

function sesionCon(rol) {
  db.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'u1@prueba.brota.test' } }, error: null });
  db.responder('perfiles_usuario', { data: { rol } });
}

/** Respuesta que filtra `filas` con los .eq(columna, valor) de la consulta. */
const tabla = (filas) => (llamadas) => ({
  data: filas.filter((f) => llamadas
    .filter((l) => l.metodo === 'eq')
    .every(({ args: [col, val] }) => f[col] === val)),
});

const hace = (min) => new Date(Date.now() - min * 60_000).toISOString();

describe('GET /api/comunidad/feed — contrato de FeedReciente', () => {
  it('sin token responde 401 en JSON con el message que muestra el frontend', async () => {
    // Act
    const res = await request(app).get('/api/comunidad/feed');

    // Assert
    expect(res.status).toBe(401);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({ success: false, message: 'Token de autenticación requerido' });
  });

  it('autorizado: 200 con los campos que usa la tarjeta, más reciente primero', async () => {
    // Arrange
    sesionCon('estudiante');
    db.responder('posts_foro', tabla([{ id: 1, titulo: 'Post viejo', anonimo: false, autor_nombre: 'Ana', created_at: hace(60), oculta: false }]))
      .responder('historias', tabla([{ id: 2, titulo: 'Historia nueva', anonimo: false, autor_nombre: 'Luis', created_at: hace(5), publicada: true, oculta: false }]))
      .responder('preguntas_comunidad', tabla([{ id: 3, titulo: 'Pregunta anónima', anonimo: true, autor_nombre: 'Real', created_at: hace(30), oculta: false }]));

    // Act
    const res = await request(app).get('/api/comunidad/feed').set('Authorization', TOKEN);

    // Assert
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.success).toBe(true);
    expect(res.body.data.map((i) => i.titulo)).toEqual(['Historia nueva', 'Pregunta anónima', 'Post viejo']);
    expect(res.body.data[0]).toEqual(expect.objectContaining({
      id: 'historia-2', tipo: 'historia', autor: 'Luis', time: expect.any(String),
      link: '/dashboard/comunidad/historia/2', linkState: {},
    }));
    // Publicación anónima: nunca viaja el nombre real
    expect(res.body.data[1].autor).toBe('Anónimo');
    expect(JSON.stringify(res.body)).not.toContain('Real');
  });

  it('no devuelve más de 8 publicaciones aunque las 3 fuentes traigan 5 cada una', async () => {
    // Arrange
    sesionCon('estudiante');
    const filas = (base) => Array.from({ length: 5 }, (_, i) => ({
      id: base + i, titulo: `T${base + i}`, anonimo: false, autor_nombre: 'X', created_at: hace(base + i), publicada: true, oculta: false,
    }));
    db.responder('posts_foro', tabla(filas(0)))
      .responder('historias', tabla(filas(10)))
      .responder('preguntas_comunidad', tabla(filas(20)));

    // Act
    const res = await request(app).get('/api/comunidad/feed').set('Authorization', TOKEN);

    // Assert
    expect(res.body.data).toHaveLength(8);
  });

  it('DEF-08: una publicación ocultada por moderación no aparece en el feed', async () => {
    // Arrange: una visible y una oculta en cada fuente
    sesionCon('estudiante');
    const par = (id) => [
      { id, titulo: `Visible ${id}`, anonimo: false, autor_nombre: 'A', created_at: hace(id), publicada: true, oculta: false },
      { id: id + 100, titulo: `Oculta ${id}`, anonimo: false, autor_nombre: 'B', created_at: hace(id), publicada: true, oculta: true },
    ];
    db.responder('posts_foro', tabla(par(1)))
      .responder('historias', tabla(par(2)))
      .responder('preguntas_comunidad', tabla(par(3)));

    // Act
    const res = await request(app).get('/api/comunidad/feed').set('Authorization', TOKEN);

    // Assert
    const titulos = res.body.data.map((i) => i.titulo);
    expect(titulos).toEqual(['Visible 1', 'Visible 2', 'Visible 3']);
  });
});

describe('PATCH /api/comunidad/moderacion/:tipo/:id/ocultar — contrato de ModeracionBar', () => {
  const ocultar = (tipo = 'pregunta', id = '42') => request(app)
    .patch(`/api/comunidad/moderacion/${tipo}/${id}/ocultar`);

  it('sin token responde 401 y no toca ninguna tabla', async () => {
    const res = await ocultar();

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Token de autenticación requerido');
    expect(db.from).not.toHaveBeenCalled();
  });

  it('un estudiante recibe 403 con el message que muestra la barra, y no se oculta nada', async () => {
    sesionCon('estudiante');

    const res = await ocultar().set('Authorization', TOKEN);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ success: false, message: 'Acceso denegado: se requiere rol admin o moderador' });
    expect(db.argumentos('preguntas_comunidad', 'update')).toEqual([]);
  });

  it.each([
    ['post', 'posts_foro'],
    ['historia', 'historias'],
    ['pregunta', 'preguntas_comunidad'],
  ])('un moderador oculta un %s: 200 { success: true } y marca oculta en %s', async (tipo, tablaReal) => {
    sesionCon('moderador');

    const res = await ocultar(tipo, '42').set('Authorization', TOKEN);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({ success: true });
    expect(db.argumentos(tablaReal, 'update')).toEqual([{ oculta: true }]);
    expect(db.llamadas(tablaReal)).toContainEqual({ metodo: 'eq', args: ['id', '42'] });
  });

  it('un tipo que no existe responde 400 y no escribe nada', async () => {
    sesionCon('admin');

    const res = await ocultar('comentario').set('Authorization', TOKEN);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: 'Tipo de publicación inválido' });
    expect(db.from).toHaveBeenCalledTimes(1); // solo la consulta del rol
  });
});
