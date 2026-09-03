const requierePermiso = require('../../src/middlewares/requierePermiso');

// A diferencia de verificarAdmin.test.js, este middleware no toca Supabase
// (confía en que verificarAuth ya dejó el perfil en req.perfil) — no hace
// falta mockear nada, solo variar req.perfil.
describe('Middleware requierePermiso', () => {
  const buildRes = () => {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    return { status, json };
  };

  it('rechaza (403) si el rol no tiene el permiso por default', () => {
    // 'comunidad.publicar' SÍ está en el default de estudiante — probamos
    // un recurso que no le corresponde a nadie por default.
    const middleware = requierePermiso('programas.editar');
    const req = { perfil: { rol: 'estudiante', permisos_override: {} } };
    const res = buildRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('permite (next) si el rol tiene el permiso por default', () => {
    const middleware = requierePermiso('comunidad.publicar');
    const req = { perfil: { rol: 'estudiante', permisos_override: {} } };
    const res = buildRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rechaza (403) si permisos_override apaga un permiso que el rol sí tendría por default', () => {
    const middleware = requierePermiso('comunidad.publicar');
    const req = { perfil: { rol: 'estudiante', permisos_override: { 'comunidad.publicar': false } } };
    const res = buildRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('permite (next) si permisos_override prende un permiso que el rol no tendría por default', () => {
    const middleware = requierePermiso('programas.editar');
    const req = { perfil: { rol: 'estudiante', permisos_override: { 'programas.editar': true } } };
    const res = buildRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
