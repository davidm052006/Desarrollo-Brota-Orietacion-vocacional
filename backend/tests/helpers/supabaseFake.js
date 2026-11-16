// Fake del cliente Supabase para pruebas unitarias de controladores.
//
// Tipo de doble: fake con stubs programables. Cada `from(tabla)` devuelve un
// query builder encadenable (select/eq/order/... devuelven el mismo builder) que
// al hacer `await` entrega la siguiente respuesta programada para esa tabla.
// Si no hay respuesta programada, entrega { data: [], error: null, count: 0 }
// (o data: null si la consulta usó single/maybeSingle).
//
// Uso:
//   const db = crearSupabaseFake();
//   db.responder('programas', { data: [{ id: 1 }] });   // primera consulta
//   db.responder('programas', { error: { message: 'x' } }); // segunda
//   db.llamadas('programas')  // [{ metodo, args }, ...] de todas las consultas
//
// Los métodos que escriben (insert/update/delete/upsert) quedan registrados con
// sus argumentos para poder verificar qué se envió.

const METODOS = [
  'select', 'insert', 'update', 'delete', 'upsert',
  'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'is', 'not', 'or', 'ilike', 'like',
  'match', 'filter', 'contains', 'order', 'range', 'limit', 'single', 'maybeSingle',
];

const VACIO = { data: [], error: null, count: 0 };

function crearSupabaseFake() {
  const colas = {};
  const registro = {};

  function from(tabla) {
    const llamadas = [];
    (registro[tabla] ??= []).push(llamadas);
    const builder = {};
    METODOS.forEach((m) => {
      builder[m] = (...args) => {
        llamadas.push({ metodo: m, args });
        return builder;
      };
    });
    builder.then = (resolve, reject) => {
      const cola = colas[tabla];
      const unaFila = llamadas.some((l) => l.metodo === 'single' || l.metodo === 'maybeSingle');
      const r = cola && cola.length ? cola.shift() : (unaFila ? { data: null } : VACIO);
      const valor = typeof r === 'function' ? r(llamadas) : r;
      return Promise.resolve({ data: null, error: null, ...valor }).then(resolve, reject);
    };
    return builder;
  }

  return {
    from: jest.fn(from),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: { message: 'sin token' } }),
      admin: {
        getUserById: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
        createUser: jest.fn(),
        deleteUser: jest.fn().mockResolvedValue({ error: null }),
        updateUserById: jest.fn().mockResolvedValue({ error: null }),
      },
    },
    responder(tabla, respuesta) {
      (colas[tabla] ??= []).push(respuesta);
      return this;
    },
    /** Todas las llamadas a métodos sobre `tabla`, aplanadas. */
    llamadas(tabla) {
      return (registro[tabla] ?? []).flat();
    },
    /** Primer argumento de cada llamada a `metodo` sobre `tabla`. */
    argumentos(tabla, metodo) {
      return this.llamadas(tabla).filter((l) => l.metodo === metodo).map((l) => l.args[0]);
    },
  };
}

function respuestaFalsa() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.send = jest.fn(() => res);
  return res;
}

/** Carga un módulo de src/ con el cliente Supabase reemplazado por `fake`. */
function cargarConFake(rutaDesdeSrc, fake) {
  const path = require('path');
  jest.resetModules();
  jest.doMock(path.resolve(__dirname, '../../src/config/supabase'), () => fake);
  return require(path.resolve(__dirname, '../../src', rutaDesdeSrc));
}

module.exports = { crearSupabaseFake, respuestaFalsa, cargarConFake };
