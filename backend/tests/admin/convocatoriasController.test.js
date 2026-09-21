const path = require('path');

function responseMock() {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  return { res: { status, json }, status, json };
}

describe('convocatoriasController', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('lista convocatorias con paginación y búsqueda', async () => {
    const query = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: [{ id: 'c-1' }], count: 1, error: null }),
      or: jest.fn().mockReturnThis(),
    };
    const supabaseMock = { from: jest.fn(() => query) };
    jest.doMock(path.resolve(__dirname, '../../src/config/supabase'), () => supabaseMock);
    const { getConvocatorias } = require('../../src/controllers/admin/convocatoriasController');
    const { res, json } = responseMock();

    await getConvocatorias({ query: { pagina: '1', limite: '10', busqueda: 'beca' } }, res);

    expect(supabaseMock.from).toHaveBeenCalledWith('convocatorias');
    expect(query.or).toHaveBeenCalled();
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: [{ id: 'c-1' }] }));
  });

  it('rechaza una convocatoria sin campos obligatorios', async () => {
    jest.doMock(path.resolve(__dirname, '../../src/config/supabase'), () => ({}));
    const { createConvocatoria } = require('../../src/controllers/admin/convocatoriasController');
    const { res, status, json } = responseMock();

    await createConvocatoria({ body: { titulo: 'Sin tipo' } }, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ success: false, message: 'El tipo es obligatorio' });
  });

  it('crea una convocatoria válida y devuelve 201', async () => {
    const single = jest.fn().mockResolvedValue({ data: { id: 'c-1', titulo: 'Beca' }, error: null });
    const insert = jest.fn(() => ({ select: jest.fn(() => ({ single })) }));
    const supabaseMock = { from: jest.fn(() => ({ insert })) };
    jest.doMock(path.resolve(__dirname, '../../src/config/supabase'), () => supabaseMock);
    const { createConvocatoria } = require('../../src/controllers/admin/convocatoriasController');
    const { res, status, json } = responseMock();

    await createConvocatoria({ body: { tipo: 'Beca', titulo: 'Beca', institucion: 'SENA' } }, res);

    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: { id: 'c-1', titulo: 'Beca' } }));
  });
});
