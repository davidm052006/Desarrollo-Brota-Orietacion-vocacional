// Semana 6 · Julian · Capa BD
// programasRepository contra la BD real (Supabase local): cada método, sus
// filtros, el ORDER BY, la paginación, el JOIN con instituciones y cada
// restricción de la tabla `programas`.
//
// Qué encuentra esto que el fake de Supabase (tests/helpers/supabaseFake.js)
// no encuentra: el fake devuelve lo que el test le dice, así que no sabe si
// `.not('area_academica','is',null)` o `.order('nombre')` de verdad filtran u
// ordenan, ni si el embed `instituciones(...)` existe como relación.
//
// Limpieza: DELETE de programas e instituciones antes de cada test.
// Cada test inserta sus propios datos; no hay ids fijos.
const {
  describeBD, consultar, limpiar, cerrar,
} = require('../helpers/bdPruebas');

describeBD('programasRepository (BD real)', () => {
  // Se carga dentro del describe para que, sin BD, no se cree el cliente.
  let repo;
  beforeAll(() => {
    repo = require('../../src/repositories/programasRepository');
  });

  beforeEach(() => limpiar(['programas', 'instituciones']));
  afterAll(cerrar);

  async function crearInstitucion(nombre = 'Universidad de Prueba') {
    const [fila] = await consultar(
      "INSERT INTO instituciones (nombre, ciudad, tipo) VALUES ($1, 'Montería', 'Universidad') RETURNING id",
      [nombre],
    );
    return fila.id;
  }

  async function crearPrograma({ nombre, area = 'tecnologia', activo = true, institucionId = null }) {
    const [fila] = await consultar(
      `INSERT INTO programas (nombre, area_academica, activo, institucion_id)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [nombre, area, activo, institucionId],
    );
    return fila.id;
  }

  const nombres = (data) => data.map((p) => p.nombre);

  // ── listarActivos ───────────────────────────────────────────

  it('BD-01 listarActivos devuelve solo programas activos y con área asignada', async () => {
    await crearPrograma({ nombre: 'Activo con área' });
    await crearPrograma({ nombre: 'Inactivo', activo: false });
    await crearPrograma({ nombre: 'Sin clasificar', area: null });

    const { data, count, error } = await repo.listarActivos();

    expect(error).toBeNull();
    expect(nombres(data)).toEqual(['Activo con área']);
    expect(count).toBe(1);
  });

  it('BD-02 listarActivos ordena por nombre aunque se hayan insertado en otro orden', async () => {
    // Insertados al revés: sin ORDER BY, Postgres los devuelve en orden de
    // inserción (no está garantizado), así que este test detecta si se quita.
    for (const nombre of ['Zootecnia', 'Medicina', 'Arquitectura', 'Enfermería']) {
      await crearPrograma({ nombre });
    }

    const { data } = await repo.listarActivos();

    expect(nombres(data)).toEqual(['Arquitectura', 'Enfermería', 'Medicina', 'Zootecnia']);
  });

  it('BD-03 listarActivos filtra por área y busca por nombre sin importar mayúsculas', async () => {
    await crearPrograma({ nombre: 'Ingeniería de Sistemas', area: 'tecnologia' });
    await crearPrograma({ nombre: 'Ingeniería Ambiental', area: 'ambiental' });
    await crearPrograma({ nombre: 'Medicina', area: 'salud' });

    const porArea = await repo.listarActivos({ area: 'tecnologia' });
    const porBusqueda = await repo.listarActivos({ search: '  INGENIERÍA ' });
    const todos = await repo.listarActivos({ area: 'todos' });

    expect(nombres(porArea.data)).toEqual(['Ingeniería de Sistemas']);
    expect(nombres(porBusqueda.data)).toEqual(['Ingeniería Ambiental', 'Ingeniería de Sistemas']);
    expect(todos.count).toBe(3);
  });

  it('BD-04 (Postgres vs MySQL) la búsqueda distingue tildes: "ingenieria" no encuentra "Ingeniería"', async () => {
    // ILIKE en Postgres ignora mayúsculas pero NO tildes. En MySQL con la
    // collation por defecto (utf8mb4_0900_ai_ci) LIKE ignora ambas y sí lo
    // encontraría. Comportamiento actual documentado: un estudiante que
    // escribe sin tilde no encuentra el programa (ver PR, observación).
    await crearPrograma({ nombre: 'Ingeniería de Sistemas' });

    const { data } = await repo.listarActivos({ search: 'ingenieria' });

    expect(data).toEqual([]);
  });

  it('BD-05 listarActivos pagina con range y el total cuenta todas las filas, no solo la página', async () => {
    for (const nombre of ['A1', 'A2', 'A3', 'A4', 'A5']) {
      await crearPrograma({ nombre });
    }

    const pagina2 = await repo.listarActivos({ offset: 2, limit: 2 });

    expect(nombres(pagina2.data)).toEqual(['A3', 'A4']);
    expect(pagina2.count).toBe(5);
  });

  it('BD-06 listarActivos trae la institución con un JOIN por la FK', async () => {
    const institucionId = await crearInstitucion('Universidad de Córdoba');
    await crearPrograma({ nombre: 'Licenciatura en Informática', institucionId });
    await crearPrograma({ nombre: 'Programa sin institución' });

    const { data } = await repo.listarActivos();

    expect(data[0]).toMatchObject({
      nombre: 'Licenciatura en Informática',
      instituciones: { nombre: 'Universidad de Córdoba', ciudad: 'Montería', tipo: 'Universidad' },
    });
    // LEFT JOIN: el programa sin institución sigue apareciendo, con null.
    expect(data[1]).toMatchObject({ nombre: 'Programa sin institución', instituciones: null });
  });

  // ── contarActivos ───────────────────────────────────────────

  it('BD-07 contarActivos cuenta por área y en total ignora inactivos y sin área', async () => {
    await crearPrograma({ nombre: 'S1', area: 'salud' });
    await crearPrograma({ nombre: 'S2', area: 'salud' });
    await crearPrograma({ nombre: 'T1', area: 'tecnologia' });
    await crearPrograma({ nombre: 'S3 inactivo', area: 'salud', activo: false });
    await crearPrograma({ nombre: 'Sin área', area: null });

    const salud = await repo.contarActivos('salud');
    const arte = await repo.contarActivos('arte');
    const total = await repo.contarActivos();

    expect(salud.count).toBe(2);
    expect(arte.count).toBe(0);
    expect(total.count).toBe(3);
  });

  // ── Restricciones de la tabla `programas` ──────────────────
  // (no tiene UNIQUE: dos instituciones pueden ofrecer el mismo nombre)

  it('BD-08 nombre es NOT NULL', async () => {
    await expect(
      consultar('INSERT INTO programas (nombre) VALUES (NULL)'),
    ).rejects.toMatchObject({ code: '23502', column: 'nombre' });
  });

  it('BD-09 nombre admite hasta 200 caracteres', async () => {
    await expect(crearPrograma({ nombre: 'x'.repeat(200) })).resolves.toBeDefined();
    await expect(crearPrograma({ nombre: 'x'.repeat(201) })).rejects.toMatchObject({ code: '22001' });
  });

  it('BD-10 institucion_id debe existir en instituciones (llave foránea)', async () => {
    await expect(
      crearPrograma({ nombre: 'Huérfano', institucionId: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toMatchObject({ code: '23503', constraint: 'programas_institucion_id_fkey' });
  });

  it('BD-11 borrar una institución borra sus programas (ON DELETE CASCADE)', async () => {
    const institucionId = await crearInstitucion();
    await crearPrograma({ nombre: 'Se va con la institución', institucionId });
    await crearPrograma({ nombre: 'Se queda' });

    await consultar('DELETE FROM instituciones WHERE id = $1', [institucionId]);

    const { data } = await repo.listarActivos();
    expect(nombres(data)).toEqual(['Se queda']);
  });
});
