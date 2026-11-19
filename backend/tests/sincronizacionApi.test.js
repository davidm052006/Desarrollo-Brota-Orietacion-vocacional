const path = require('path');
const request = require('supertest');

function createSupabaseMock() {
  const inserted = {
    instituciones: [],
    programas: [],
    sincronizaciones: [],
  };

  const supabase = {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'admin-1', email: 'admin@brota.test' } },
        error: null,
      }),
    },
    from: jest.fn(table => {
      if (table === 'perfiles_usuario') {
        const query = {
          select: jest.fn(() => query),
          eq: jest.fn(() => query),
          single: jest.fn().mockResolvedValue({
            data: { rol: 'admin' },
            error: null,
          }),
        };
        return query;
      }

      if (table === 'men_sincronizacion') {
        return {
          insert: jest.fn(row => {
            inserted.sincronizaciones.push(row);
            return Promise.resolve({ data: null, error: null });
          }),
        };
      }

      let insertRows;
      const query = {
        select: jest.fn(() => query),
        insert: jest.fn(rows => {
          insertRows = rows;
          inserted[table].push(rows);
          return query;
        }),
        then: (resolve, reject) => {
          const result = insertRows
            ? table === 'instituciones'
              ? {
                  data: insertRows.map((row, index) => ({
                    id: `institucion-${index + 1}`,
                    nombre: row.nombre,
                  })),
                  error: null,
                }
              : { data: null, error: null }
            : { data: [], error: null };
          return Promise.resolve(result).then(resolve, reject);
        },
      };
      return query;
    }),
  };

  return { supabase, inserted };
}

function createMenResponse({ ok = true, status = 200, json, text = '' } = {}) {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(json),
    text: jest.fn().mockResolvedValue(text),
  };
}

describe('API de sincronización con MEN', () => {
  let app;
  let fetchStub;
  let inserted;
  let supabaseMock;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    ({ supabase: supabaseMock, inserted } = createSupabaseMock());
    jest.doMock(
      path.resolve(__dirname, '../src/config/supabase'),
      () => supabaseMock,
    );
    app = require('../src/server');

    // Stub de fetch: la prueba nunca contacta el servicio público de datos.
    fetchStub = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('no consulta MEN cuando falta autorización de administrador', async () => {
    // Stub de la dependencia externa y expectativa de que no se invoque.
    fetchStub.mockResolvedValue(createMenResponse({ json: [] }));

    const response = await request(app).post('/api/admin/sincronizacion/ejecutar');

    expect(response.status).toBe(401);
    expect(response.headers['content-type']).toMatch(/^application\/json/);
    expect(response.body).toEqual({
      success: false,
      message: 'Token de autenticación requerido',
    });
    expect(fetchStub).not.toHaveBeenCalled();
  });

  it('sincroniza y transforma los datos recibidos de MEN antes de guardarlos', async () => {
    // Stub externo con una fila determinista; Supabase es un fake en memoria
    // que captura los lotes enviados y devuelve un id para relacionar el programa.
    fetchStub
      .mockResolvedValueOnce(createMenResponse({
        json: { rowsUpdatedAt: 1_798_000_000 },
      }))
      .mockResolvedValueOnce(createMenResponse({
        json: [{
          nombreestadoprograma: 'Activo',
          nombreinstitucion: 'Universidad Nacional',
          nombrecaracteracademico: 'Universidad',
          nombremunicipioinstitucion: 'Bogotá',
          nombredepartinstitucion: 'Cundinamarca',
          nombreprograma: 'Ingeniería de Sistemas',
          nombretituloobtenido: 'Ingeniero de sistemas',
          nombrenbc: 'Ingeniería de sistemas telemática y afines',
          nombreareaconocimiento: 'Ingeniería, arquitectura, urbanismo y afines',
          nombrenivelformacion: 'Universitaria',
          cantidadperiodos: '10',
          nombreperiodicidad: 'Semestral',
          nombremetodologia: 'Presencial',
        }],
      }));

    const response = await request(app)
      .post('/api/admin/sincronizacion/ejecutar')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/^application\/json/);
    expect(response.body).toEqual(expect.objectContaining({
      success: true,
      programasImportados: 1,
      institucionesImportadas: 1,
    }));
    expect(fetchStub).toHaveBeenCalledTimes(2);
    expect(fetchStub.mock.calls[0][0]).toContain('/api/views/upr9-nkiz.json');
    expect(fetchStub.mock.calls[1][0]).toContain('/resource/upr9-nkiz.json');

    expect(inserted.instituciones[0]).toEqual([expect.objectContaining({
      nombre: 'Universidad Nacional',
      ciudad: 'Bogotá',
      activa: true,
    })]);
    expect(inserted.programas[0]).toEqual([expect.objectContaining({
      nombre: 'Ingeniero de Sistemas',
      area_academica: 'tecnologia',
      duracion: '10 semestres',
      modalidad: 'Presencial',
      institucion_id: 'institucion-1',
      activo: true,
    })]);
    expect(inserted.sincronizaciones).toContainEqual(expect.objectContaining({
      estado: 'exitosa',
      programas_importados: 1,
      instituciones_importadas: 1,
    }));
  });

  it('devuelve un error JSON y registra la falla si MEN rechaza la descarga', async () => {
    // Stub: metadata disponible, pero la descarga principal responde 503.
    fetchStub
      .mockResolvedValueOnce(createMenResponse({
        json: { rowsUpdatedAt: 1_798_000_000 },
      }))
      .mockResolvedValueOnce(createMenResponse({
        ok: false,
        status: 503,
        text: 'Servicio temporalmente no disponible',
      }));

    const response = await request(app)
      .post('/api/admin/sincronizacion/ejecutar')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(500);
    expect(response.headers['content-type']).toMatch(/^application\/json/);
    expect(response.body).toEqual({
      success: false,
      error: 'MEN API 503: Servicio temporalmente no disponible',
    });
    expect(inserted.sincronizaciones).toContainEqual(expect.objectContaining({
      estado: 'fallida',
      error: 'MEN API 503: Servicio temporalmente no disponible',
    }));
  });
});
