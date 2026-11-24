// Humo de la BD de pruebas: confirma que las migraciones de supabase/
// construyeron el mismo esquema que producción. Si falla, la BD de pruebas
// no está migrada (corre `supabase db reset`) y el resto de la integración
// no tiene sentido.
const { describeBD, consultar, limpiar, crearUsuarioAuth, cerrar } = require('../helpers/bdPruebas');

describeBD('BD de pruebas (Supabase local)', () => {
  afterAll(cerrar);

  it('es Postgres 17, la misma versión mayor que producción', async () => {
    const [{ server_version_num: v }] = await consultar('SHOW server_version_num');
    expect(Math.floor(Number(v) / 10000)).toBe(17);
  });

  // El esquema sale del respaldo de producción del 21 nov 2026: 22 tablas en
  // uso + 4 huérfanas (perfiles, roles, programa_categorias,
  // perfiles_vocacionales; ver docs/modelo_datos.md) + 2 del tablero del equipo.
  it('tiene las 28 tablas del esquema de producción', async () => {
    const filas = await consultar(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY 1",
    );
    const tablas = filas.map((f) => f.table_name);
    expect(tablas).toHaveLength(28);
    expect(tablas).toEqual(expect.arrayContaining([
      'perfiles_usuario', 'programas', 'instituciones', 'cuestionarios',
      'preguntas_comunidad', 'men_sincronizacion',
    ]));
  });

  it('la limpieza borra los usuarios de prueba y sus filas en cascada', async () => {
    const { id } = await crearUsuarioAuth('limpieza');
    await consultar(
      'INSERT INTO perfiles_usuario (user_id, nombre, apellido) VALUES ($1, $2, $3)',
      [id, 'Prueba', 'Limpieza'],
    );

    await limpiar();

    expect(await consultar('SELECT 1 FROM auth.users WHERE id = $1', [id])).toHaveLength(0);
    expect(await consultar('SELECT 1 FROM perfiles_usuario WHERE user_id = $1', [id])).toHaveLength(0);
  });
});
