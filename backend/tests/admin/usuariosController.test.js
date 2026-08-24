const path = require('path');

describe('usuariosController.createUsuario', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('crea usuario exitosamente y responde 201', async () => {
    const insertMock = jest.fn().mockResolvedValue({ error: null });
    const updateEqMock = jest.fn().mockResolvedValue({ error: null });
    const updateMock = jest.fn(() => ({ eq: updateEqMock }));

    const supabaseMock = {
      auth: {
        admin: {
          createUser: jest.fn().mockResolvedValue({ data: { user: { id: 'uid-1' } }, error: null }),
          deleteUser: jest.fn().mockResolvedValue({ error: null }),
        }
      },
      from: jest.fn(() => ({ insert: insertMock, update: updateMock }))
    };

    jest.doMock(path.resolve(__dirname, '../../src/config/supabase'), () => supabaseMock);
    const { createUsuario } = require('../../src/controllers/admin/usuariosController');

    const req = { body: { email: 'a@b.com', password: 'secret1', nombre: 'A', apellido: 'B' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status, json };

    await createUsuario(req, res);

    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    expect(supabaseMock.auth.admin.createUser).toHaveBeenCalledTimes(1);
    expect(supabaseMock.from).toHaveBeenCalledWith('perfiles_usuario');
  });

  it('valida campos obligatorios y responde 400', async () => {
    jest.doMock(path.resolve(__dirname, '../../src/config/supabase'), () => ({}));
    const { createUsuario } = require('../../src/controllers/admin/usuariosController');

    const req = { body: { email: '', password: '', nombre: '', apellido: '' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status, json };

    await createUsuario(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('si falla la creación del perfil hace rollback (deleteUser) y responde 500', async () => {
    const insertMock = jest.fn().mockResolvedValue({ error: { message: 'db error' } });
    const updateMock = jest.fn(() => ({ eq: jest.fn().mockResolvedValue({ error: null }) }));

    const deleteUserMock = jest.fn().mockResolvedValue({ error: null });

    const supabaseMock = {
      auth: {
        admin: {
          createUser: jest.fn().mockResolvedValue({ data: { user: { id: 'uid-rollback' } }, error: null }),
          deleteUser: deleteUserMock,
        }
      },
      from: jest.fn(() => ({ insert: insertMock, update: updateMock }))
    };

    jest.doMock(path.resolve(__dirname, '../../src/config/supabase'), () => supabaseMock);
    const { createUsuario } = require('../../src/controllers/admin/usuariosController');

    const req = { body: { email: 'x@x.com', password: 'secret1', nombre: 'X', apellido: 'Y' } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status, json };

    await createUsuario(req, res);

    expect(deleteUserMock).toHaveBeenCalledWith('uid-rollback');
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });
});
