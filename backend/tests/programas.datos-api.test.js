const request = require('supertest');

// Supabase es un mock de repositorio: nunca se conecta a datos reales.
const query = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  not: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn(),
};
jest.mock('../src/config/supabase', () => ({ from: jest.fn() }));
const supabaseMock = require('../src/config/supabase');
const app = require('../src/server');

beforeEach(() => {
  jest.clearAllMocks();
  supabaseMock.from.mockImplementation(() => query);
  query.range.mockResolvedValue({ data: [], count: 0, error: null });
});

describe('Semana 4 / David — API y datos simulados', () => {
  it('devuelve lista vacía y metadatos coherentes cuando no hay programas', async () => {
    // Arrange: repositorio vacío; Act:
    const res = await request(app).get('/api/programas?page=2&limit=10');
    // Assert: estado, cuerpo y encabezado.
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({ success: true, data: [], total: 0, page: 2, limit: 10, totalPages: 0 });
    expect(query.range).toHaveBeenCalledWith(10, 19);
  });

  it('filtra por categoría cuando el usuario la selecciona', async () => {
    // Arrange / Act
    const res = await request(app).get('/api/programas?area=tecnologia');
    // Assert
    expect(res.status).toBe(200);
    expect(query.eq).toHaveBeenCalledWith('area_academica', 'tecnologia');
  });

  it('filtra por nombre ignorando espacios de los extremos', async () => {
    // Arrange / Act
    const res = await request(app).get('/api/programas?search=%20Sistemas%20');
    // Assert
    expect(res.status).toBe(200);
    expect(query.ilike).toHaveBeenCalledWith('nombre', '%Sistemas%');
  });

  it('calcula páginas a partir del total devuelto por la base simulada', async () => {
    // Arrange
    query.range.mockResolvedValue({ data: [{ id: 'p1', nombre: 'Programa A' }], count: 25, error: null });
    // Act
    const res = await request(app).get('/api/programas?page=1&limit=10');
    // Assert
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([{ id: 'p1', nombre: 'Programa A' }]);
    expect(res.body.totalPages).toBe(3);
    expect(res.body.total).toBe(25);
  });

  it('devuelve error JSON cuando falla el repositorio, sin devolver datos', async () => {
    // Arrange
    query.range.mockResolvedValue({ data: null, count: null, error: { message: 'fallo simulado' } });
    // Act
    const res = await request(app).get('/api/programas');
    // Assert
    expect(res.status).toBe(500);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.success).toBe(false);
    expect(res.body.data).toBeUndefined();
  });
});
