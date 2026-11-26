// Semana 2 · Brayan · Capa API: reglas de compatibilidad de algoritmoRecomendacion.js
//
// Los tests existentes (tests/utils/algoritmoRecomendacion.test.js) cubren el
// alias de categorías, el cap 4-3-1 y las razones. Faltaba lo que la ficha pide
// explícitamente: la puntuación base por cada tipo de área, las bonificaciones
// combinadas y el LÍMITE MÁXIMO de compatibilidad (Math.min(1.0, …)).
//
// La compatibilidad es una función privada: se observa en las filas que
// generarRecomendaciones inserta en `recomendaciones` (fake de Supabase).
const { crearSupabaseFake } = require('../helpers/supabaseFake');
const { generarRecomendaciones } = require('../../src/utils/algoritmoRecomendacion');

// Total 10 puntos: tecnología 50 %, negocios 30 %, arte 20 %.
const PERFIL = {
  categoriaPrincipal: 'tecnologia',
  categoriaSecundaria: 'negocios',
  scores: [
    { categoria: 'tecnologia', puntos: 5 },
    { categoria: 'negocios', puntos: 3 },
    { categoria: 'arte', puntos: 2 },
  ],
};

const DATOS = { duracion: '8 semestres', modalidad: 'Presencial', descripcion: 'Programa' };

function programa(id, area, cuantosDatos = 0) {
  const extra = Object.fromEntries(Object.entries(DATOS).slice(0, cuantosDatos));
  return { id, nombre: id, tipo: 'Universitaria', area_academica: area, ...extra };
}

/** Responde cada categoría del top 3 en orden; las que no se pasan van vacías. */
async function recomendar(perfil, porCategoria) {
  const db = crearSupabaseFake();
  perfil.scores.slice(0, 3).forEach((s) => {
    db.responder('programas', { data: porCategoria[s.categoria] ?? [] });
  });
  await generarRecomendaciones('res-1', perfil, db);
  const [filas = []] = db.argumentos('recomendaciones', 'insert');
  return { db, filas };
}

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('compatibilidad: base + bonificaciones', () => {
  it.each([
    // área,        datos, esperado   = base + bonus de área + datos × 0.005
    ['tecnologia', 0, 0.58],   // 0.50 + 0.08 (principal)
    ['tecnologia', 3, 0.595],  // 0.50 + 0.08 + 0.015
    ['negocios',   1, 0.345],  // 0.30 + 0.04 (secundaria) + 0.005
    ['arte',       0, 0.2],    // 0.20, sin bonus de área
    ['arte',       2, 0.21],   // 0.20 + 0.010
  ])('%s con %i datos completos → %d', async (area, datos, esperado) => {
    // Arrange
    const porCategoria = { [area]: [programa('p1', area, datos)] };

    // Act
    const { filas } = await recomendar(PERFIL, porCategoria);

    // Assert
    expect(filas).toEqual([expect.objectContaining({ programa_id: 'p1', compatibilidad: esperado })]);
  });
});

describe('compatibilidad: límite máximo de 1.0', () => {
  it.each([
    // puntos del área principal / total, datos → la suma pasaría de 1
    ['justo en el límite (0.92 + 0.08)', 92, 8, 0, 1],
    ['por encima con datos (0.92 + 0.08 + 0.015)', 92, 8, 3, 1],
    ['100 % + bonus principal + datos', 10, 0, 3, 1],
    ['justo debajo del límite (0.91 + 0.08)', 91, 9, 0, 0.99],
  ])('%s → %d', async (_caso, principal, resto, datos, esperado) => {
    // Arrange
    const perfil = {
      categoriaPrincipal: 'salud',
      categoriaSecundaria: null,
      scores: [{ categoria: 'salud', puntos: principal }, { categoria: 'arte', puntos: resto }],
    };

    // Act
    const { filas } = await recomendar(perfil, { salud: [programa('s1', 'salud', datos)] });

    // Assert
    expect(filas[0].compatibilidad).toBe(esperado);
    expect(filas[0].compatibilidad).toBeLessThanOrEqual(1);
  });

  it('en el tope, el bonus de datos completos ya no desempata', async () => {
    // Arrange: los dos llegan al 100 %; uno tiene los 3 datos y el otro ninguno
    const perfil = {
      categoriaPrincipal: 'salud',
      categoriaSecundaria: null,
      scores: [{ categoria: 'salud', puntos: 10 }],
    };

    // Act
    const { filas } = await recomendar(perfil, {
      salud: [programa('sin-datos', 'salud', 0), programa('con-datos', 'salud', 3)],
    });

    // Assert
    expect(filas.map((f) => f.compatibilidad)).toEqual([1, 1]);
  });
});

describe('consulta de programas', () => {
  it('pide solo programas activos, sin posgrados y con el límite de 50 por categoría', async () => {
    // Act
    const { db } = await recomendar(PERFIL, {});

    // Assert: una consulta por cada categoría del top 3
    const llamadas = db.llamadas('programas');
    const conArgs = (metodo) => llamadas.filter((l) => l.metodo === metodo).map((l) => l.args);
    expect(conArgs('eq').filter(([col]) => col === 'activo')).toEqual([
      ['activo', true], ['activo', true], ['activo', true],
    ]);
    expect(conArgs('neq')).toEqual([['tipo', 'Posgrado'], ['tipo', 'Posgrado'], ['tipo', 'Posgrado']]);
    expect(conArgs('limit')).toEqual([[50], [50], [50]]);
  });
});
