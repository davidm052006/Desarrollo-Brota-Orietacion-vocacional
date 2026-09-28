const path = require('path');

// El tipo se valida antes de tocar Supabase, así que para los casos de 400
// alcanza con un mock vacío: si el controller lo usara, el test fallaría.
function mockSupabase(impl = {}) {
  jest.doMock(path.resolve(__dirname, '../../src/config/supabase'), () => impl);
}

function fakeRes() {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  return { res: { status, json }, status, json };
}

const bodyValido = {
  cuestionario_id: 'cuest-1',
  texto: '¿Qué te gusta hacer?',
  tipo: 'opcion_unica',
  opciones: [
    { label: 'A', pesos: { tecnologia: 5 } },
    { label: 'B', pesos: { arte: 5 } },
  ],
};

describe('institucion/preguntasController — validación de tipo', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('createPregunta responde 400 con un tipo fuera del catálogo', async () => {
    mockSupabase({});
    const { createPregunta } = require('../../src/controllers/institucion/preguntasController');

    const { res, status, json } = fakeRes();
    await createPregunta(
      { body: { ...bodyValido, tipo: 'cualquier_cosa' }, institucionId: 'inst-1' },
      res
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: expect.stringContaining('Tipo de pregunta inválido'),
    }));
  });

  it('updatePregunta responde 400 con un tipo fuera del catálogo', async () => {
    mockSupabase({});
    const { updatePregunta } = require('../../src/controllers/institucion/preguntasController');

    const { res, status, json } = fakeRes();
    await updatePregunta(
      { params: { id: 'preg-1' }, body: { tipo: 'cualquier_cosa' }, institucionId: 'inst-1' },
      res
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('createPregunta normaliza el alias legado antes de insertar', async () => {
    const insert = jest.fn(() => ({
      select: jest.fn(() => ({ single: jest.fn().mockResolvedValue({ data: { id: 'preg-1' }, error: null }) })),
    }));
    // El insert de opciones/pesos reusa el mismo `from`, con su propio select/single.
    const cuestionarioSingle = jest.fn().mockResolvedValue({
      data: { institucion_id: 'inst-1' }, error: null,
    });

    mockSupabase({
      from: jest.fn(() => ({
        select: jest.fn(() => ({ eq: jest.fn(() => ({ single: cuestionarioSingle })) })),
        insert,
      })),
    });

    const { createPregunta } = require('../../src/controllers/institucion/preguntasController');
    const { res, status } = fakeRes();

    await createPregunta(
      { body: { ...bodyValido, tipo: 'seleccion' }, institucionId: 'inst-1' },
      res
    );

    expect(status).toHaveBeenCalledWith(201);
    // La primera llamada a insert es la de la pregunta.
    expect(insert.mock.calls[0][0][0]).toEqual(
      expect.objectContaining({ tipo: 'opcion_unica' })
    );
  });
});

describe('admin/preguntasController — validación de tipo', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('createPregunta responde 400 con un tipo fuera del catálogo', async () => {
    mockSupabase({});
    const { createPregunta } = require('../../src/controllers/admin/preguntasController');

    const { res, status, json } = fakeRes();
    await createPregunta(
      { body: { cuestionario_id: 'c1', texto: 'x', tipo: 'cualquier_cosa' } },
      res
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('createPregunta normaliza el alias legado antes de insertar', async () => {
    const insert = jest.fn(() => ({
      select: jest.fn(() => ({ single: jest.fn().mockResolvedValue({ data: { id: 'preg-1' }, error: null }) })),
    }));
    mockSupabase({ from: jest.fn(() => ({ insert })) });

    const { createPregunta } = require('../../src/controllers/admin/preguntasController');
    const { res, status } = fakeRes();

    await createPregunta(
      { body: { cuestionario_id: 'c1', texto: 'x', tipo: 'multiple' } },
      res
    );

    expect(status).toHaveBeenCalledWith(201);
    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({ tipo: 'opcion_multiple' }),
    ]);
  });
});
