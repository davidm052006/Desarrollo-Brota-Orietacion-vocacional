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
    expect(deleteUser).toHaveBeenCalledWith('usuario-1');
  });

  it('elimina el usuario de Auth cuando falta un campo requerido', async () => {
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
    expect(deleteUser).toHaveBeenCalledWith('usuario-1');
  });

  it('devuelve error interno y registra el fallo si no puede eliminar el usuario de Auth', async () => {
    const deleteError = new Error('No se pudo eliminar el usuario');
    const deleteUser = jest.fn().mockResolvedValue({ error: deleteError });
    const supabaseMock = {
      from: jest.fn(),
      auth: { admin: { deleteUser } },
    };
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.doMock(path.resolve(__dirname, '../src/config/supabase'), () => supabaseMock);
    const { registerPerfil } = require('../src/controllers/authController');
    const req = {
      body: { nombre: 'N'.repeat(101) },
      user: { id: 'usuario-1' },
    };
    const res = responseMock();

    await registerPerfil(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      success: false,
      message: 'No pudimos completar tu registro. Por favor intenta de nuevo.',
    });
    expect(deleteUser).toHaveBeenCalledWith('usuario-1');
    expect(consoleError).toHaveBeenCalledWith(
      'authController.registerPerfil — rollback fallido:',
      deleteError,
    );
    consoleError.mockRestore();
  });

  it('registra una excepción si falla el rollback', async () => {
    const deleteError = new Error('Error de conexión');
    const deleteUser = jest.fn().mockRejectedValue(deleteError);
    const supabaseMock = {
      from: jest.fn(),
      auth: { admin: { deleteUser } },
    };
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.doMock(path.resolve(__dirname, '../src/config/supabase'), () => supabaseMock);
    const { registerPerfil } = require('../src/controllers/authController');
    const req = {
      body: { nombre: 'N'.repeat(101) },
      user: { id: 'usuario-1' },
    };
    const res = responseMock();

    await registerPerfil(req, res);

    expect(res.statusCode).toBe(500);
    expect(deleteUser).toHaveBeenCalledWith('usuario-1');
    expect(consoleError).toHaveBeenCalledWith(
      'authController.registerPerfil — rollback fallido:',
      deleteError,
    );
    consoleError.mockRestore();
  });
});
