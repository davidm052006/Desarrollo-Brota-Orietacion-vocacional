const { crearSupabaseFake } = require('../helpers/supabaseFake');
const {
  generarRecomendaciones,
  normalizarScore,
  pctAbsoluto,
} = require('../../src/utils/algoritmoRecomendacion');

const programa = (id, area, extra = {}) => ({
  id, nombre: `P${id}`, tipo: 'Universitaria', area_academica: area, ...extra,
});

const perfil = {
  categoriaPrincipal: 'tecnologia',
  categoriaSecundaria: 'emprendimiento',
  scores: [
    { categoria: 'tecnologia', puntos: 6 },
    { categoria: 'emprendimiento', puntos: 3 },
    { categoria: 'arte', puntos: 1 },
    { categoria: 'salud', puntos: 0 },
  ],
};

function filasInsertadas(db) {
  const [filas] = db.argumentos('recomendaciones', 'insert');
  return filas;
}

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('funciones puras', () => {
  it('normalizarScore traduce alias del cuestionario a área del MEN', () => {
    expect(normalizarScore({ categoria: 'ambiente', puntos: 2 })).toEqual({ categoria: 'ambiental', puntos: 2 });
    expect(normalizarScore({ categoria: 'salud', puntos: 2 })).toEqual({ categoria: 'salud', puntos: 2 });
  });

  it('pctAbsoluto devuelve la proporción real de puntos y 0 si no hay puntos', () => {
    expect(pctAbsoluto(perfil.scores, 'tecnologia')).toBe(60);
    expect(pctAbsoluto(perfil.scores, 'inexistente')).toBe(0);
    expect(pctAbsoluto([{ categoria: 'x', puntos: 0 }], 'x')).toBe(0);
  });
});

describe('generarRecomendaciones', () => {
  it('consulta solo las top 3 categorías con puntaje, normalizando el alias', async () => {
    const db = crearSupabaseFake();

    await generarRecomendaciones('res-1', perfil, db);

    const areas = db.llamadas('programas')
      .filter((l) => l.metodo === 'eq' && l.args[0] === 'area_academica')
      .map((l) => l.args[1]);
    expect(areas).toEqual(['tecnologia', 'negocios', 'arte']);
    // Sin programas en ninguna categoría no se inserta nada
    expect(db.argumentos('recomendaciones', 'insert')).toEqual([]);
  });

  it('calcula compatibilidad con bonificaciones, aplica el cap 4-3-1 y guarda máximo 8', async () => {
    const db = crearSupabaseFake();
    const tec = Array.from({ length: 6 }, (_, i) => programa(`t${i}`, 'tecnologia'));
    tec[0] = programa('t0', 'tecnologia', { duracion: '8 semestres', modalidad: 'Presencial', descripcion: 'x' });
    db.responder('programas', { data: tec })
      .responder('programas', { data: Array.from({ length: 5 }, (_, i) => programa(`n${i}`, 'negocios')) })
      .responder('programas', { data: Array.from({ length: 3 }, (_, i) => programa(`a${i}`, 'arte')) });

    await generarRecomendaciones('res-1', perfil, db);

    const filas = filasInsertadas(db);
    expect(filas).toHaveLength(8); // 4 + 3 + 1
    // El de datos completos queda primero: 0.6 + 0.08 + 3 × 0.005
    expect(filas[0]).toMatchObject({ resultado_id: 'res-1', programa_id: 't0', compatibilidad: 0.695 });
    expect(filas.filter((f) => f.programa_id.startsWith('t'))).toHaveLength(4);
    expect(filas.filter((f) => f.programa_id.startsWith('n'))).toHaveLength(3);
    expect(filas.filter((f) => f.programa_id.startsWith('a'))).toHaveLength(1);
    // Negocios recibe bonus de secundaria: 0.3 + 0.04
    expect(filas.find((f) => f.programa_id === 'n0').compatibilidad).toBe(0.34);
  });

  it('guarda las razones como JSON con el porcentaje y el motivo de la categoría', async () => {
    const db = crearSupabaseFake();
    db.responder('programas', {
      data: [programa('t1', 'tecnologia', { tipo: 'Tecnológica', duracion: '6 semestres' })],
    }).responder('programas', { data: [programa('n1', 'negocios')] });

    await generarRecomendaciones('res-1', perfil, db);

    const filas = filasInsertadas(db);
    const razonesTec = JSON.parse(filas.find((f) => f.programa_id === 't1').razones);
    expect(razonesTec).toEqual([
      'El 60% de tus respuestas ponderadas se relaciona con tecnología',
      'Está en el área que más te interesó en el test',
      'Formación tecnológica con duración de 6 semestres',
    ]);
    const razonesNeg = JSON.parse(filas.find((f) => f.programa_id === 'n1').razones);
    expect(razonesNeg[1]).toBe('Se relaciona con tu segunda área de interés');
  });

  it('no consulta nada si ninguna categoría tiene puntos', async () => {
    const db = crearSupabaseFake();

    await generarRecomendaciones('res-1', { categoriaPrincipal: 'x', scores: [{ categoria: 'x', puntos: 0 }] }, db);

    expect(db.from).not.toHaveBeenCalled();
  });

  it('si falla una categoría sigue con las demás', async () => {
    const db = crearSupabaseFake();
    db.responder('programas', { error: { message: 'timeout' } })
      .responder('programas', { data: [programa('n1', 'negocios')] });

    await generarRecomendaciones('res-1', perfil, db);

    expect(filasInsertadas(db).map((f) => f.programa_id)).toEqual(['n1']);
  });

  it('no lanza si falla el insert ni ante un error inesperado', async () => {
    const db = crearSupabaseFake();
    db.responder('programas', { data: [programa('t1', 'tecnologia')] })
      .responder('recomendaciones', { error: { message: 'fk' } });

    await expect(generarRecomendaciones('res-1', perfil, db)).resolves.toBeUndefined();
    await expect(generarRecomendaciones('res-1', perfil, null)).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });
});
