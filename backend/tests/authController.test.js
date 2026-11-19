const path = require('path');

function responseMock() {
  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  return res;
}

describe('authController.registerPerfil', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('rechaza un nombre que supera el límite antes de insertar en Supabase', async () => {
    const deleteUser = jest.fn().mockResolvedValue({ error: null });
    const supabaseMock = {
      from: jest.fn(),
      auth: { admin: { deleteUser } },
    };
    jest.doMock(path.resolve(__dirname, '../src/config/supabase'), () => supabaseMock);
    const { registerPerfil } = require('../src/controllers/authController');
    const req = {
      body: { nombre: 'N'.repeat(101) },
      user: { id: 'usuario-1' },
    };
    const res = responseMock();

    await registerPerfil(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: 'El campo nombre no puede superar 100 caracteres',
    });
    expect(supabaseMock.from).not.toHaveBeenCalled();
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it('conserva la cuenta de Auth cuando falta un campo requerido', async () => {
    const deleteUser = jest.fn().mockResolvedValue({ error: null });
    const supabaseMock = {
      from: jest.fn(),
      auth: { admin: { deleteUser } },
    };
    jest.doMock(path.resolve(__dirname, '../src/config/supabase'), () => supabaseMock);
    const { registerPerfil } = require('../src/controllers/authController');
    const req = {
      body: {},
      user: { id: 'usuario-1' },
    };
    const res = responseMock();

    await registerPerfil(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: 'El campo nombre es requerido',
    });
    expect(supabaseMock.from).not.toHaveBeenCalled();
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it('no elimina la cuenta si el nombre excede el límite aunque falle deleteUser', async () => {
    const deleteUser = jest.fn().mockRejectedValue(new Error('No debe llamarse'));
    jest.doMock(path.resolve(__dirname, '../src/config/supabase'), () => ({
      from: jest.fn(), auth: { admin: { deleteUser } },
    }));
    const { registerPerfil } = require('../src/controllers/authController');
    const res = responseMock();
    await registerPerfil({ body: { nombre: 'N'.repeat(101) }, user: { id: 'usuario-1' } }, res);
    expect(res.statusCode).toBe(400);
    expect(deleteUser).not.toHaveBeenCalled();
  });
});
