const {
  generarRecomendaciones,
  pctAbsoluto,
  normalizarScore,
} = require('../src/utils/algoritmoRecomendacion');

describe('pctAbsoluto', () => {
  it('calcula el porcentaje de puntos de una categoría respecto al total', () => {
    const scores = [
      { categoria: 'arte', puntos: 6 },
      { categoria: 'salud', puntos: 4 },
    ];

    expect(pctAbsoluto(scores, 'arte')).toBe(60);
  });

  it('devuelve cero cuando no hay puntos para calcular un porcentaje', () => {
    const scores = [{ categoria: 'arte', puntos: 0 }];

    expect(pctAbsoluto(scores, 'arte')).toBe(0);
  });

  it('devuelve cero si la categoría consultada no está en los puntajes', () => {
    const scores = [
      { categoria: 'arte', puntos: 6 },
      { categoria: 'salud', puntos: 4 },
    ];

    expect(pctAbsoluto(scores, 'ciencias')).toBe(0);
  });
});

describe('normalizarScore', () => {
  it('convierte emprendimiento a negocios y conserva los demás datos', () => {
    const score = {
      categoria: 'emprendimiento',
      puntos: 6,
      porcentaje: 60,
    };

    expect(normalizarScore(score)).toEqual({
      categoria: 'negocios',
      puntos: 6,
      porcentaje: 60,
    });
  });

  it('conserva una categoría que no tiene alias', () => {
    const score = { categoria: 'arte', puntos: 6 };

    expect(normalizarScore(score)).toEqual(score);
  });

  it('convierte ambiente a ambiental', () => {
    const score = { categoria: 'ambiente', puntos: 5 };

    expect(normalizarScore(score)).toEqual({
      categoria: 'ambiental',
      puntos: 5,
    });
  });
});

describe('generarRecomendaciones', () => {
  it('cambia el orden de las recomendaciones cuando cambia la categoría con más puntos', async () => {
    const programasPorCategoria = {
      arte: [{ id: 'programa-arte', area_academica: 'arte' }],
      salud: [{ id: 'programa-salud', area_academica: 'salud' }],
    };
    const inserciones = [];
    const supabase = {
      from: jest.fn((tabla) => {
        if (tabla === 'programas') {
          let categoria;
          const consulta = {
            select: jest.fn(() => consulta),
            eq: jest.fn((campo, valor) => {
              if (campo === 'area_academica') categoria = valor;
              return consulta;
            }),
            neq: jest.fn(() => consulta),
            limit: jest.fn(async () => ({
              data: programasPorCategoria[categoria] ?? [],
              error: null,
            })),
          };

          return consulta;
        }

        return {
          insert: jest.fn(async (filas) => {
            inserciones.push(filas);
            return { error: null };
          }),
        };
      }),
    };

    await generarRecomendaciones('resultado-arte', {
      categoriaPrincipal: 'arte',
      categoriaSecundaria: 'salud',
      scores: [
        { categoria: 'arte', puntos: 6 },
        { categoria: 'salud', puntos: 4 },
      ],
    }, supabase);

    await generarRecomendaciones('resultado-salud', {
      categoriaPrincipal: 'salud',
      categoriaSecundaria: 'arte',
      scores: [
        { categoria: 'salud', puntos: 6 },
        { categoria: 'arte', puntos: 4 },
      ],
    }, supabase);

    expect(inserciones).toHaveLength(2);
    expect(inserciones[0].map(({ programa_id }) => programa_id))
      .toEqual(['programa-arte', 'programa-salud']);
    expect(inserciones[1].map(({ programa_id }) => programa_id))
      .toEqual(['programa-salud', 'programa-arte']);
  });
});