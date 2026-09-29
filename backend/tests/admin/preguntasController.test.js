const path = require('path');

function responseMock() {
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json: jest.fn(function (body) { this.body = body; return this; }),
  };
  return res;
}

function supabaseWithoutEsCorrecta() {
  const missingColumn = { code: '42703', message: 'column opciones.es_correcta does not exist' };
  const probe = { limit: jest.fn().mockResolvedValue({ error: missingColumn }) };
  const questionResult = {
    data: [{ id: 'q-1', texto: 'Pregunta', orden: 1, opciones: [{ id: 'o-1', label: 'Sí', orden: 0 }] }],
    error: null,
  };
  const questionQuery = {
    select: jest.fn(() => questionQuery),
    order: jest.fn(() => questionQuery),
    eq: jest.fn(() => questionQuery),
    ilike: jest.fn(() => questionQuery),
    update: jest.fn(() => ({ eq: jest.fn().mockResolvedValue({ error: null }) })),
    then: (resolve, reject) => Promise.resolve(questionResult).then(resolve, reject),
  };
  const optionsTable = {
    select: jest.fn(() => probe),
    delete: jest.fn(() => ({ eq: jest.fn().mockResolvedValue({ error: null }) })),
    insert: jest.fn().mockResolvedValue({ error: null }),
  };
  const supabaseMock = {
    from: jest.fn(table => table === 'opciones' ? optionsTable : questionQuery),
  };

  return { supabaseMock, questionQuery, optionsTable };
}

function cargarController(supabaseMock) {
  jest.doMock(path.resolve(__dirname, '../../src/config/supabase'), () => supabaseMock);
  return require('../../src/controllers/admin/preguntasController');
}

describe('preguntasController con esquema antiguo', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('lista preguntas aunque opciones.es_correcta no exista', async () => {
    const { supabaseMock, questionQuery } = supabaseWithoutEsCorrecta();
    const { getPreguntas } = cargarController(supabaseMock);
    const res = responseMock();

    await getPreguntas({ query: { cuestionario_id: 'cuestionario-1' } }, res);

    expect(questionQuery.select.mock.calls[0][0]).not.toContain('es_correcta');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].opciones[0].es_correcta).toBe(false);
    expect(res.body.meta.es_correcta_disponible).toBe(false);
  });

  it('guarda opciones normales sin incluir la columna faltante', async () => {
    const { supabaseMock, questionQuery, optionsTable } = supabaseWithoutEsCorrecta();
    const { updatePregunta } = cargarController(supabaseMock);
    const res = responseMock();

    await updatePregunta({
      params: { id: 'q-1' },
      body: { texto: 'Actualizada', opciones: [{ label: 'Sí', es_correcta: false }] },
    }, res);

    expect(questionQuery.update).toHaveBeenCalled();
    expect(optionsTable.delete).toHaveBeenCalled();
    expect(optionsTable.insert).toHaveBeenCalledWith([
      { pregunta_id: 'q-1', label: 'Sí', icon: null, orden: 0 },
    ]);
    expect(res.body.success).toBe(true);
  });

  it('rechaza marcar una respuesta correcta antes de modificar la pregunta', async () => {
    const { supabaseMock, questionQuery, optionsTable } = supabaseWithoutEsCorrecta();
    const { updatePregunta } = cargarController(supabaseMock);
    const res = responseMock();

    await updatePregunta({
      params: { id: 'q-1' },
      body: { texto: 'Actualizada', opciones: [{ label: 'Sí', es_correcta: true }] },
    }, res);

    expect(res.statusCode).toBe(409);
    expect(questionQuery.update).not.toHaveBeenCalled();
    expect(optionsTable.delete).not.toHaveBeenCalled();
  });
});