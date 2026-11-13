// Semana 5 · Capa API: dobles de prueba sobre la sincronización con el MEN.
// La sincronización depende de dos cosas externas: la API pública de
// datos.gov.co (vía fetch) y Supabase. Aquí ninguna de las dos es real:
//   - fetch     → stub/mock con jest.fn (controlamos qué responde el MEN).
//   - Supabase  → fake en memoria que guarda lo que se insertó/borró.
//   - Date.now  → spy para que la duración sea determinista.
// Cada test indica qué doble usa y por qué.
const request = require('supertest');

// ---------- Fake de Supabase ----------
// Implementación mínima que funciona: responde según tabla + operación
// y registra cada escritura en `db.escrituras` para comprobar el estado.
const db = {
  rol: 'admin',            // rol del usuario que llama
  ultima: null,            // última fila de men_sincronizacion
  viejas: { instituciones: [], programas: [] },
  fallaPurga: false,       // simula error al borrar datos viejos
  escrituras: [],          // [{ tabla, op, datos }]
};

jest.mock('../../src/config/supabase', () => {
  const builder = (tabla) => {
    const q = { op: 'select', datos: null };
    ['select', 'eq', 'order', 'limit'].forEach((m) => { q[m] = jest.fn(() => q); });
    q.insert = jest.fn((datos) => { q.op = 'insert'; q.datos = datos; return q; });
    q.delete = jest.fn(() => { q.op = 'delete'; return q; });
    q.in = jest.fn((_col, ids) => { q.datos = ids; return q; });
    q.single = jest.fn(async () => (tabla === 'perfiles_usuario'
      ? { data: { rol: db.rol }, error: null }
      : { data: null, error: null }));
    q.maybeSingle = jest.fn(async () => ({ data: db.ultima, error: null }));
    q.then = (resolve, reject) => {
      const resultado = (() => {
        if (q.op === 'insert') {
          db.escrituras.push({ tabla, op: 'insert', datos: q.datos });
          const filas = Array.isArray(q.datos) ? q.datos : [q.datos];
          return { data: filas.map((f, i) => ({ id: `${tabla}-nuevo-${i}`, ...f })), error: null };
        }
        if (q.op === 'delete') {
          if (db.fallaPurga) throw new Error('Supabase no responde');
          db.escrituras.push({ tabla, op: 'delete', datos: q.datos });
          return { data: null, error: null };
        }
        return { data: db.viejas[tabla] ?? [], error: null };
      });
      return new Promise((res) => res(resultado())).then(resolve, reject);
    };
    return q;
  };
  return {
    auth: {
      getUser: jest.fn(async () => ({ data: { user: { id: 'admin-1' } }, error: null })),
    },
    from: jest.fn((tabla) => builder(tabla)),
  };
});

const app = require('../../src/server');

const TOKEN = 'Bearer token-de-prueba';
const META_URL = 'https://datos.gov.co/api/views/upr9-nkiz.json';

// Respuesta HTTP mínima, con lo que el controlador usa de fetch.
const respuesta = (status, cuerpo) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => cuerpo,
  text: async () => (typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo)),
});

// Dos programas de la misma institución + uno sin institución (se descarta).
const REGISTROS_MEN = [
  {
    nombreinstitucion: 'UNIVERSIDAD DE PRUEBA',
    nombrecaracteracademico: 'Universidad',
    nombremunicipioinstitucion: 'Bogotá D.C.',
    nombredepartinstitucion: 'Bogotá D.C.',
    nombreprograma: 'INGENIERIA DE SISTEMAS',
    nombretituloobtenido: 'INGENIERO DE SISTEMAS',
    nombrenbc: 'Ingeniería de Sistemas Telemática y Afines',
    nombreareaconocimiento: 'Ingeniería Arquitectura Urbanismo y Afines',
    nombrenivelformacion: 'Universitaria',
    cantidadperiodos: '10',
    nombreperiodicidad: 'Semestral',
    nombremetodologia: 'Presencial',
  },
  {
    nombreinstitucion: 'Universidad de Prueba ',
    nombrecaracteracademico: 'Universidad',
    nombreprograma: 'PSICOLOGIA',
    nombretituloobtenido: 'PSICOLOGO',
    nombrenbc: 'Psicología',
    nombrenivelformacion: 'Universitaria',
    cantidadperiodos: '9',
    nombreperiodicidad: 'Semestral',
    nombremetodologia: 'Virtual',
  },
  { nombreinstitucion: '', nombreprograma: 'SIN INSTITUCION' },
];

const escriturasEn = (tabla, op) => db.escrituras.filter((e) => e.tabla === tabla && e.op === op);

beforeEach(() => {
  db.rol = 'admin';
  db.ultima = null;
  db.viejas = { instituciones: [{ id: 'inst-viejo' }], programas: [{ id: 'prog-viejo' }] };
  db.fallaPurga = false;
  db.escrituras = [];
  global.fetch = jest.fn();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  delete global.fetch;
});

describe('API · sincronización MEN con dobles de prueba', () => {
  // SINC-01 · Stub que falla + verificación de estado.
  // Por qué un stub: necesitamos que datos.gov.co "se caiga" a voluntad,
  // cosa imposible con la API real. Se verifica la respuesta, no la llamada.
  it('GET /estado resiste si la metadata del MEN no responde', async () => {
    db.ultima = { ejecutada_en: '2026-11-01T10:00:00Z', programas_importados: 14000, remote_timestamp: 1700000000 };
    global.fetch.mockRejectedValue(new Error('ECONNRESET'));

    const res = await request(app).get('/api/admin/sincronizacion/estado').set('Authorization', TOKEN);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      ultimaSincronizacion: '2026-11-01T10:00:00Z',
      programasImportados: 14000,
      remoteTimestamp: null,
      remoteDate: null,
      hayActualizacion: true,
    });
  });

  // SINC-02 · Stub con respuesta fija + estado.
  // Por qué un stub: fijamos rowsUpdatedAt igual al guardado para probar
  // la regla "no hay actualización" sin depender de cuándo cambia el MEN.
  it('GET /estado no ofrece actualización si el MEN no cambió desde la última sync', async () => {
    db.ultima = { ejecutada_en: '2026-11-01T10:00:00Z', remote_timestamp: 1700000000 };
    global.fetch.mockResolvedValue(respuesta(200, { rowsUpdatedAt: 1700000000 }));

    const res = await request(app).get('/api/admin/sincronizacion/estado').set('Authorization', TOKEN);

    expect(res.status).toBe(200);
    expect(res.body.hayActualizacion).toBe(false);
    expect(res.body.remoteDate).toBe(new Date(1700000000 * 1000).toISOString());
  });

  // SINC-03 · Mock (comportamiento): verifica CON QUÉ se llamó al MEN.
  // Por qué un mock: el contrato importante es la consulta enviada
  // (solo programas activos, lotes de 5000, empezando en 0) y que no se
  // pida otra página cuando el lote llegó incompleto.
  it('POST /ejecutar consulta al MEN solo programas activos, paginados, sin pedir páginas de más', async () => {
    global.fetch
      .mockResolvedValueOnce(respuesta(200, { rowsUpdatedAt: 1800000000 }))
      .mockResolvedValueOnce(respuesta(200, REGISTROS_MEN));

    const res = await request(app).post('/api/admin/sincronizacion/ejecutar').set('Authorization', TOKEN);

    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch.mock.calls[0][0]).toBe(META_URL);
    const urlDatos = global.fetch.mock.calls[1][0];
    expect(urlDatos).toContain("$where=nombreestadoprograma='Activo'");
    expect(urlDatos).toContain('$limit=5000');
    expect(urlDatos).toContain('$offset=0');
    expect(escriturasEn('men_sincronizacion', 'insert')[0].datos).toMatchObject({
      remote_timestamp: 1800000000,
      estado: 'exitosa',
    });
  });

  // SINC-04 · Fake de Supabase (estado): qué quedó guardado.
  // Por qué un fake: con una BD en memoria podemos leer las filas
  // insertadas y comprobar la normalización, en vez de solo contar llamadas.
  it('POST /ejecutar guarda instituciones sin duplicar y programas normalizados', async () => {
    global.fetch
      .mockResolvedValueOnce(respuesta(200, {}))
      .mockResolvedValueOnce(respuesta(200, REGISTROS_MEN));

    const res = await request(app).post('/api/admin/sincronizacion/ejecutar').set('Authorization', TOKEN);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, programasImportados: 2, institucionesImportadas: 1 });

    const instituciones = escriturasEn('instituciones', 'insert').flatMap((e) => e.datos);
    expect(instituciones).toEqual([{
      nombre: 'UNIVERSIDAD DE PRUEBA',
      tipo: 'Universidad',
      ciudad: 'Bogotá D.C.',
      departamento: 'Bogotá D.C.',
      activa: true,
    }]);

    const programas = escriturasEn('programas', 'insert').flatMap((e) => e.datos);
    expect(programas).toEqual([
      expect.objectContaining({
        nombre: 'Ingeniero de Sistemas',
        tipo: 'Universidad',
        area_academica: 'tecnologia',
        duracion: '10 semestres',
        modalidad: 'Presencial',
        institucion_id: 'instituciones-nuevo-0',
      }),
      expect.objectContaining({
        nombre: 'Psicologo',
        area_academica: 'social',
        duracion: '9 semestres',
        modalidad: 'Virtual',
        institucion_id: 'instituciones-nuevo-0',
      }),
    ]);
  });

  // SINC-05 · Stub que falla + verificación de que NO se tocó la BD.
  // Por qué un stub: simulamos la API del MEN devolviendo 503. Lo que
  // importa es que los datos previos quedan intactos (cero insert/delete
  // en programas e instituciones) y que el fallo queda registrado.
  it('POST /ejecutar con el MEN caído no borra ni inserta datos y registra la sync fallida', async () => {
    global.fetch
      .mockResolvedValueOnce(respuesta(200, { rowsUpdatedAt: 1800000000 }))
      .mockResolvedValueOnce(respuesta(503, 'Service Unavailable'));

    const res = await request(app).post('/api/admin/sincronizacion/ejecutar').set('Authorization', TOKEN);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    for (const tabla of ['instituciones', 'programas', 'recomendaciones']) {
      expect(escriturasEn(tabla, 'insert')).toHaveLength(0);
      expect(escriturasEn(tabla, 'delete')).toHaveLength(0);
    }
    expect(escriturasEn('men_sincronizacion', 'insert')[0].datos).toMatchObject({
      estado: 'fallida',
      programas_importados: 0,
      remote_timestamp: 1800000000,
    });
  });

  // SINC-06 · Fake con fallo en la purga (estado).
  // Por qué: si borrar los datos viejos falla, los nuevos ya están
  // guardados; la sync debe darse por exitosa en vez de devolver 500.
  it('POST /ejecutar se da por exitosa aunque falle la purga de datos viejos', async () => {
    db.fallaPurga = true;
    global.fetch
      .mockResolvedValueOnce(respuesta(200, {}))
      .mockResolvedValueOnce(respuesta(200, REGISTROS_MEN));

    const res = await request(app).post('/api/admin/sincronizacion/ejecutar').set('Authorization', TOKEN);

    expect(res.status).toBe(200);
    expect(escriturasEn('programas', 'insert')).toHaveLength(1);
    expect(escriturasEn('men_sincronizacion', 'insert')[0].datos.estado).toBe('exitosa');
  });

  // SINC-07 · Spy sobre el reloj (Date.now).
  // Por qué un spy: la duración depende del reloj real; fijamos el inicio
  // y el fin para que duracionSegundos sea exacto y el test no sea frágil.
  // Se llama al controlador directo (sin supertest) porque Express y el
  // rate limiter también leen Date.now y consumirían los valores fijados.
  it('ejecutarSincronizacion calcula la duración con el reloj inyectado', async () => {
    const { ejecutarSincronizacion } = require('../../src/controllers/sincronizacionController');
    const reloj = jest.spyOn(Date, 'now').mockReturnValueOnce(1_000).mockReturnValueOnce(4_500);
    global.fetch
      .mockResolvedValueOnce(respuesta(200, {}))
      .mockResolvedValueOnce(respuesta(200, []));
    // Spy sobre res: registra lo que el controlador responde.
    const res = { status: jest.fn(() => res), json: jest.fn(() => res) };

    await ejecutarSincronizacion({}, res);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, duracionSegundos: 3.5 }));
    expect(reloj).toHaveBeenCalledTimes(2);
  });

  // SINC-08 · Mock (comportamiento): la dependencia NO debe llamarse.
  // Por qué: si quien llama no es admin, ni siquiera se consulta al MEN.
  // Un dummy no bastaría: necesitamos verificar cero llamadas a fetch.
  it('POST /ejecutar sin rol admin responde 403 y no llama al MEN', async () => {
    db.rol = 'estudiante';

    const res = await request(app).post('/api/admin/sincronizacion/ejecutar').set('Authorization', TOKEN);

    expect(res.status).toBe(403);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(db.escrituras).toHaveLength(0);
  });
});
