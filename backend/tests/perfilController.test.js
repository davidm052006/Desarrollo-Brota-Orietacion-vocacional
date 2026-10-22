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

function cargarController(supabaseMock) {
  jest.doMock(path.resolve(__dirname, '../src/config/supabase'), () => supabaseMock);
  jest.doMock(path.resolve(__dirname, '../src/utils/perfilvocacional'), () => ({
    calcularDesdeRespuestas: jest.fn(),
    calcularPorcentajes: jest.fn(),
  }));
  jest.doMock(path.resolve(__dirname, '../src/utils/algoritmoRecomendacion'), () => ({
    generarRecomendaciones: jest.fn(),
  }));
  return require('../src/controllers/perfilController');
}

describe('perfilController.guardarResultado', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('rechaza la solicitud cuando faltan campos obligatorios', async () => {
    const supabaseMock = { from: jest.fn() };
    const { guardarResultado } = cargarController(supabaseMock);
    const req = { body: {} };
    const res = responseMock();

    await guardarResultado(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: 'Faltan campos: perfil_usuario_id, cuestionario_id, respuestas',
    });
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });

  it('rechaza el resultado cuando el perfil no pertenece al usuario autenticado', async () => {
    const consultaPerfil = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Perfil no encontrado para el usuario' },
      }),
    };
    const supabaseMock = { from: jest.fn(() => consultaPerfil) };
    const { guardarResultado } = cargarController(supabaseMock);
    const calculos = require('../src/utils/perfilvocacional');
    const req = {
      body: {
        perfil_usuario_id: 'perfil-ajeno',
        cuestionario_id: 'cuestionario-1',
        respuestas: { 'pregunta-1': ['opcion-1'] },
      },
      user: { id: 'usuario-1' },
    };
    const res = responseMock();

    await guardarResultado(req, res);

    expect(supabaseMock.from).toHaveBeenCalledWith('perfiles_usuario');
    expect(consultaPerfil.eq).toHaveBeenNthCalledWith(1, 'id', 'perfil-ajeno');
    expect(consultaPerfil.eq).toHaveBeenNthCalledWith(2, 'user_id', 'usuario-1');
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({
      success: false,
      message: 'No autorizado para este perfil',
    });
    expect(calculos.calcularDesdeRespuestas).not.toHaveBeenCalled();
    expect(supabaseMock.from).toHaveBeenCalledTimes(1);
  });

  it('guarda el resultado y genera recomendaciones para un perfil autorizado', async () => {
    const perfilQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: 'perfil-1' }, error: null }),
    };
    const resultado = { id: 'resultado-1', perfil_usuario_id: 'perfil-1' };
    const resultadoQuery = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: resultado, error: null }),
    };
    const supabaseMock = {
      from: jest.fn((tabla) => tabla === 'perfiles_usuario' ? perfilQuery : resultadoQuery),
    };
    const { guardarResultado } = cargarController(supabaseMock);
    const calculos = require('../src/utils/perfilvocacional');
    const { generarRecomendaciones } = require('../src/utils/algoritmoRecomendacion');
    const perfilVocacional = {
      categoriaPrincipal: 'arte',
      categoriaSecundaria: 'salud',
      scores: [{ categoria: 'arte', puntos: 6 }],
    };
    const porcentajes = { arte: 100 };
    calculos.calcularDesdeRespuestas.mockResolvedValue(perfilVocacional);
    calculos.calcularPorcentajes.mockReturnValue(porcentajes);
    generarRecomendaciones.mockResolvedValue(undefined);
    const req = {
      body: {
        perfil_usuario_id: 'perfil-1',
        cuestionario_id: 'cuestionario-1',
        respuestas: { 'pregunta-1': ['opcion-1'] },
      },
      user: { id: 'usuario-1' },
    };
    const res = responseMock();

    await guardarResultado(req, res);

    expect(calculos.calcularDesdeRespuestas)
      .toHaveBeenCalledWith('cuestionario-1', req.body.respuestas, supabaseMock);
    expect(calculos.calcularPorcentajes).toHaveBeenCalledWith(perfilVocacional);
    expect(resultadoQuery.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        perfil_usuario_id: 'perfil-1',
        cuestionario_id: 'cuestionario-1',
        respuestas: req.body.respuestas,
        perfil_vocacional: { ...perfilVocacional, porcentajes },
        fecha_realizacion: expect.any(String),
      }),
    ]);
    expect(generarRecomendaciones)
      .toHaveBeenCalledWith('resultado-1', perfilVocacional, supabaseMock);
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      success: true,
      message: 'Resultado guardado',
      data: resultado,
    });
  });
});
