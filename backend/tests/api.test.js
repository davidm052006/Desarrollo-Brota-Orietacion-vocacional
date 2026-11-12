const request = require('supertest');

const mockProgramasQuery = {
  select: jest.fn(),
  eq: jest.fn(),
  not: jest.fn(),
  ilike: jest.fn(),
  order: jest.fn(),
  range: jest.fn(),
};

mockProgramasQuery.select.mockReturnValue(mockProgramasQuery);
mockProgramasQuery.eq.mockReturnValue(mockProgramasQuery);
mockProgramasQuery.not.mockReturnValue(mockProgramasQuery);
mockProgramasQuery.ilike.mockReturnValue(mockProgramasQuery);
mockProgramasQuery.order.mockReturnValue(mockProgramasQuery);
mockProgramasQuery.range.mockResolvedValue({
  data: [{ id: 'programa-1', nombre: 'Programa de prueba' }],
  error: null,
  count: 1,
});

jest.mock('../src/config/supabase', () => ({
  from: jest.fn(() => mockProgramasQuery),
}));

const supabaseConfigurado = jest.requireActual('../src/config/supabase');
const app = require('../src/server');

// Pruebas mínimas de arranque para el sistema. Cubren un CRUD público
// (lectura de programas), el guard de autenticación de las rutas admin y
// el health check sin depender de la disponibilidad de Supabase.

describe('API — smoke tests', () => {
  it('configura el cliente de Supabase sin abrir conexiones de red', () => {
    expect(typeof supabaseConfigurado.from).toBe('function');
  });

  it('GET /api/programas responde 200 con la forma esperada', async () => {
    const res = await request(app).get('/api/programas');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/programas acepta filtros de área y búsqueda', async () => {
    const res = await request(app).get('/api/programas?area=salud&search=enfermeria');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(mockProgramasQuery.eq).toHaveBeenCalledWith('area_academica', 'salud');
    expect(mockProgramasQuery.ilike).toHaveBeenCalledWith('nombre', '%enfermeria%');
  });

  it('GET /api/admin/analytics sin token responde 401', async () => {
    const res = await request(app).get('/api/admin/analytics');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/health responde ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
