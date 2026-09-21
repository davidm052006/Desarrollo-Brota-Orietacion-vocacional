const { calcularDesdeRespuestas } = require('../src/utils/perfilvocacional');

describe('calcularDesdeRespuestas', () => {
  it('ignora respuestas abiertas y calcula las opciones puntuables', async () => {
    const query = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: [{
          id: 'pregunta-opcion',
          opciones: [{ id: 'opcion-a', pesos_opciones: [{ categoria: 'arte', puntos: 2 }] }],
        }, {
          id: 'pregunta-abierta',
          opciones: [],
        }],
        error: null,
      }),
    };
    const supabase = { from: jest.fn(() => query) };

    const resultado = await calcularDesdeRespuestas('cuestionario-1', {
      'pregunta-opcion': ['opcion-a'],
      'pregunta-abierta': ['Mi respuesta escrita'],
    }, supabase);

    expect(resultado.categoriaPrincipal).toBe('arte');
    expect(resultado.scores).toEqual([{ categoria: 'arte', puntos: 2, porcentaje: 100 }]);
  });

  it('tolera respuestas no basadas en arreglos', async () => {
    const query = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: [{ id: 'pregunta-1', opciones: [] }], error: null }),
    };
    const supabase = { from: jest.fn(() => query) };

    await expect(calcularDesdeRespuestas('cuestionario-1', { 'pregunta-1': 'texto' }, supabase))
      .resolves.toMatchObject({ categoriaPrincipal: null, scores: [] });
  });
});
