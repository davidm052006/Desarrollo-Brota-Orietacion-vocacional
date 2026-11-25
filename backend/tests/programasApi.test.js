const path = require('path');
const request = require('supertest');

const programa = {
  id: 'programa-1',
  nombre: 'Desarrollo de software',
  tipo: 'tecnico',
  area_academica: 'tecnologia',
  duracion: '24 meses',
  modalidad: 'presencial',
  costo_matricula: 0,
  instituciones: {
    nombre: 'Institución Brota',
    tipo: 'publica',
    ciudad: 'Bogotá',
    telefono: '6010000000',
    email: 'contacto@brota.test',
    sitio_web: 'https://brota.test',
  },
};

describe('Contrato API consumido por el frontend de programas', () => {
  let app;
  let queries;
  let programResult;
  let supabaseMock;

  beforeEach(() => {
    jest.resetModules();
    queries = [];
    programResult = { data: [programa], count: 1, error: null };

    supabaseMock = {
      auth: { getUser: jest.fn() },
      from: jest.fn(() => {
        let isCountQuery = false;
        let requestedArea;
        const query = {
          select: jest.fn((_fields, options) => {
            isCountQuery = options?.head === true;
            return query;
          }),
          eq: jest.fn((field, value) => {
            if (field === 'area_academica') requestedArea = value;
            return query;
          }),
          not: jest.fn(() => query),
          ilike: jest.fn(() => query),
          order: jest.fn(() => query),
          range: jest.fn(() => query),
          then: (resolve, reject) => Promise.resolve(
            isCountQuery
              ? { count: requestedArea === 'tecnologia' ? 7 : 0, error: null }
              : programResult,
          ).then(resolve, reject),
        };
        queries.push(query);
        return query;
      }),
    };

    jest.doMock(
      path.resolve(__dirname, '../src/config/supabase'),
      () => supabaseMock,
    );
    app = require('../src/server');
  });

  it('devuelve los campos que la interfaz necesita para cada programa', async () => {
    const response = await request(app).get('/api/programas');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/^application\/json/);
    expect(response.body).toEqual({
      success: true,
      data: [programa],
      total: 1,
      page: 1,
      limit: 24,
      totalPages: 1,
    });
  });

  it('aplica los filtros y conserva la paginación esperada por el cliente', async () => {
    programResult = { data: [programa], count: 3, error: null };

    const response = await request(app)
      .get('/api/programas?area=tecnologia&search=%20software%20&page=2&limit=1');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      total: 3,
      page: 2,
      limit: 1,
      totalPages: 3,
    });
    expect(queries[0].eq).toHaveBeenCalledWith('area_academica', 'tecnologia');
    expect(queries[0].ilike).toHaveBeenCalledWith('nombre', '%software%');
    expect(queries[0].range).toHaveBeenCalledWith(1, 1);
  });

  it('devuelve estadísticas con el contrato que usa la página de programas', async () => {
    const response = await request(app).get('/api/programas/stats');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/^application\/json/);
    expect(response.body.success).toBe(true);
    expect(response.body.total).toBe(0);
    expect(response.body.areas).toHaveLength(14);
    expect(response.body.areas).toContainEqual({
      area: 'tecnologia',
      count: 7,
    });
  });

  it('devuelve un error JSON cuando falla la consulta de programas', async () => {
    programResult = {
      data: null,
      count: null,
      error: { message: 'Servicio de datos no disponible' },
    };

    const response = await request(app).get('/api/programas');

    expect(response.status).toBe(500);
    expect(response.headers['content-type']).toMatch(/^application\/json/);
    // DEF-04 (#59): el 500 no expone el mensaje de Supabase; el frontend
    // (programasService) lee json.error || json.message
    expect(response.body).toEqual({
      success: false,
      message: 'Error interno del servidor',
    });
  });
});
