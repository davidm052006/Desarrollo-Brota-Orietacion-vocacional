const path = require('path');

describe('Middleware verificarAdmin', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('rechaza cuando falta el token (401)', async () => {
    jest.doMock(path.resolve(__dirname, '../../src/config/supabase'), () => ({}));
    const verificarAdmin = require('../../src/middlewares/verificarAdmin');

    const req = { headers: {} };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status, json };
    const next = jest.fn();

    await verificarAdmin(req, res, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rechaza token inválido (401)', async () => {
    const supabaseMock = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: { message: 'invalid' } }) }
    };
    jest.doMock(path.resolve(__dirname, '../../src/config/supabase'), () => supabaseMock);
    const verificarAdmin = require('../../src/middlewares/verificarAdmin');

    const req = { headers: { authorization: 'Bearer badtoken' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status, json };
    const next = jest.fn();

    await verificarAdmin(req, res, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rechaza cuando rol !== admin (403)', async () => {
    const supabaseMock = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
      from: jest.fn(() => ({ select: () => ({ eq: () => ({ single: jest.fn().mockResolvedValue({ data: { rol: 'estudiante' }, error: null }) }) }) }))
    };
    jest.doMock(path.resolve(__dirname, '../../src/config/supabase'), () => supabaseMock);
    const verificarAdmin = require('../../src/middlewares/verificarAdmin');

    const req = { headers: { authorization: 'Bearer goodtoken' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status, json };
    const next = jest.fn();

    await verificarAdmin(req, res, next);

    expect(status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('permite acceso si rol es admin y llama next()', async () => {
    const user = { id: 'admin-1', email: 'a@b.com' };
    const supabaseMock = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }) },
      from: jest.fn(() => ({ select: () => ({ eq: () => ({ single: jest.fn().mockResolvedValue({ data: { rol: 'admin' }, error: null }) }) }) }))
    };
    jest.doMock(path.resolve(__dirname, '../../src/config/supabase'), () => supabaseMock);
    const verificarAdmin = require('../../src/middlewares/verificarAdmin');

    const req = { headers: { authorization: 'Bearer goodtoken' } };
    const res = {};
    const next = jest.fn();

    await verificarAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(user);
  });
});
