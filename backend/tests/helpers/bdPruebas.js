// ============================================================
// BD de pruebas (semana 6): Supabase local levantado con el CLI.
// ============================================================
// La conexión llega SOLO por variables de entorno (ninguna credencial en
// los tests):
//   DATABASE_URL          postgresql://...@127.0.0.1:55322/postgres
//   SUPABASE_URL          http://127.0.0.1:55321
//   SUPABASE_SERVICE_KEY  llave service_role del Supabase local
// Se cargan con `supabase status -o env` (ver README, sección Tests).
//
// Sin DATABASE_URL, los tests de integración se SALTAN: el CI de hoy no
// tiene BD (llega en la semana 8) y sigue en verde.
//
// Protección: backend/.env apunta al Supabase remoto de desarrollo. Si
// DATABASE_URL o SUPABASE_URL no son locales, se aborta antes de tocar
// nada, para que un test que trunca tablas nunca corra contra esa BD.

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
const hayBD = Boolean(DATABASE_URL);

const HOSTS_LOCALES = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);

function esLocal(url) {
  try {
    return HOSTS_LOCALES.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

if (hayBD) {
  if (!esLocal(DATABASE_URL)) {
    throw new Error('DATABASE_URL no apunta a una BD local: los tests de integración solo corren contra la BD de pruebas.');
  }
  if (!esLocal(process.env.SUPABASE_URL)) {
    throw new Error('SUPABASE_URL no es local: carga las variables con `supabase status -o env` antes de correr la integración.');
  }
}

/** describe que se salta cuando no hay BD de pruebas. */
const describeBD = hayBD ? describe : describe.skip;

let pool;
function bd() {
  if (!pool) pool = new Pool({ connectionString: DATABASE_URL, max: 2 });
  return pool;
}

async function consultar(sql, params = []) {
  const { rows } = await bd().query(sql, params);
  return rows;
}

// Dominio reservado para los usuarios que crean los tests: la limpieza
// borra solo esos, nunca otros.
const DOMINIO_PRUEBA = 'prueba.brota.test';

/**
 * Limpieza explícita antes de cada test: vacía las tablas indicadas, en ese
 * orden (hijas primero), y borra los usuarios de Auth creados por los tests.
 * Se usa DELETE y no TRUNCATE ... CASCADE porque TRUNCATE en cascada vaciaría
 * también tablas que solo referencian a estas (p. ej. vaciar `instituciones`
 * se llevaría `perfiles_usuario` y `cuestionarios`, incluido el test
 * vocacional que crea la migración). DELETE respeta el ON DELETE de cada FK.
 */
async function limpiar(tablas = []) {
  for (const tabla of tablas) {
    await consultar(`DELETE FROM public."${tabla}"`);
  }
  await consultar('DELETE FROM auth.users WHERE email LIKE $1', [`%@${DOMINIO_PRUEBA}`]);
}

/** Crea un usuario en auth.users (lo exigen las FK) y devuelve su id. */
async function crearUsuarioAuth(nombre = 'usuario') {
  const email = `${nombre}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@${DOMINIO_PRUEBA}`;
  const [fila] = await consultar(
    `INSERT INTO auth.users (id, instance_id, aud, role, email, created_at, updated_at)
     VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $1, now(), now())
     RETURNING id`,
    [email],
  );
  return { id: fila.id, email };
}

/**
 * Crea un usuario real en el Auth local (contraseña aleatoria, generada
 * acá) e inicia sesión, para llamar rutas con verificarAuth. Devuelve el
 * id y el access_token.
 */
async function crearUsuarioConSesion(nombre = 'sesion') {
  const { createClient } = require('@supabase/supabase-js');
  const opciones = { auth: { persistSession: false, autoRefreshToken: false } };
  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, opciones);
  const email = `${nombre}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@${DOMINIO_PRUEBA}`;
  const password = `P-${Math.random().toString(36).slice(2)}-${Date.now()}`;

  const creado = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (creado.error) throw creado.error;

  const cliente = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, opciones);
  const sesion = await cliente.auth.signInWithPassword({ email, password });
  if (sesion.error) throw sesion.error;

  return { id: creado.data.user.id, email, token: sesion.data.session.access_token };
}

async function cerrar() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}

module.exports = {
  hayBD,
  describeBD,
  esLocal,
  consultar,
  limpiar,
  crearUsuarioAuth,
  crearUsuarioConSesion,
  cerrar,
  DOMINIO_PRUEBA,
};
