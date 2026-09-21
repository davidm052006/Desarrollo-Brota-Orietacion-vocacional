// Fuente única de verdad del vocabulario de tipos de pregunta del test vocacional.
//
// Antes de esto, cada parte del sistema escribía su propio valor en la columna
// libre `preguntas.tipo` (VARCHAR(50) sin CHECK): el runner del test usaba
// `single`/`multiple`/`likert`, el CRUD admin `opcion_multiple` y el CRUD de
// institución `seleccion`. Resultado: una pregunta creada desde cualquiera de
// los dos paneles no matcheaba ninguna rama del runner y se renderizaba como
// una grilla que no se comportaba ni como única ni como múltiple.
//
// Las claves de TIPOS_PREGUNTA son el vocabulario canónico (lo único que se
// escribe en la base de ahora en adelante); ALIAS traduce los valores viejos,
// que siguen existiendo en filas ya guardadas y no se van a migrar a mano.
//
// Espejo en backend/src/utils/tiposPregunta.js (CommonJS) — mismo criterio que
// utils/calcularEdad.js. Si se agrega un tipo acá, agregarlo también allá.

export const TIPOS_PREGUNTA = {
  single: {
    label: 'Selección única (perfil vocacional)',
    multiple: false,
    abierta: false,
    descripcion: 'Elige una opción que aporta a tu perfil vocacional.',
  },
  opcion_unica: {
    label: 'Opción única',
    multiple: false,
    abierta: false,
    descripcion: 'El estudiante elige una sola opción entre varias tarjetas.',
  },
  opcion_multiple: {
    label: 'Opción múltiple',
    multiple: true,
    abierta: false,
    descripcion: 'El estudiante puede marcar todas las opciones que apliquen.',
  },
  likert: {
    label: 'Escala Likert',
    multiple: false,
    abierta: false,
    descripcion: 'Escala gráfica de 5 puntos, de menor a mayor afinidad.',
  },
  respuesta_corta: {
    label: 'Respuesta corta',
    multiple: false,
    abierta: true,
    descripcion: 'El estudiante responde con una frase breve.',
  },
  respuesta_larga: {
    label: 'Respuesta larga',
    multiple: false,
    abierta: true,
    descripcion: 'El estudiante desarrolla una respuesta escrita.',
  },
};

// A lo que cae cualquier tipo que no se reconozca: preferimos una pregunta que
// se pueda responder (aunque sea con el comportamiento equivocado) antes que
// una pantalla en blanco a mitad del test.
export const TIPO_POR_DEFECTO = 'opcion_unica';

// Valores legados que siguen vivos en la base. No borrar entradas de acá sin
// migrar antes las filas correspondientes.
const ALIAS = {
  seleccion: 'opcion_unica',
  multiple: 'opcion_multiple',
};

/** Traduce un valor de `preguntas.tipo` (canónico o legado) a la clave canónica. */
export function normalizarTipo(tipo) {
  if (typeof tipo === 'string') {
    const clave = tipo.trim().toLowerCase();
    if (clave in TIPOS_PREGUNTA) return clave;
    if (clave in ALIAS) return ALIAS[clave];
    if (clave) {
      console.warn(
        `[tiposPregunta] Tipo de pregunta desconocido: "${tipo}". Se usa "${TIPO_POR_DEFECTO}".`
      );
    }
  }
  return TIPO_POR_DEFECTO;
}

/** true si el tipo (canónico o alias) es uno de los que conocemos. */
export function esTipoValido(tipo) {
  if (typeof tipo !== 'string') return false;
  const clave = tipo.trim().toLowerCase();
  return clave in TIPOS_PREGUNTA || clave in ALIAS;
}

/** true si el tipo admite varias opciones seleccionadas a la vez. */
export function esSeleccionMultiple(tipo) {
  return TIPOS_PREGUNTA[normalizarTipo(tipo)].multiple;
}

/** true si el tipo espera una respuesta escrita, no una opción existente. */
export function esPreguntaAbierta(tipo) {
  return TIPOS_PREGUNTA[normalizarTipo(tipo)].abierta;
}

/** Metadata del tipo, ya normalizado. Nunca devuelve undefined. */
export function getTipoInfo(tipo) {
  const clave = normalizarTipo(tipo);
  return { clave, ...TIPOS_PREGUNTA[clave] };
}

/** Para los <select> de tipo de los CRUD (admin e institución). */
export const OPCIONES_TIPO = Object.entries(TIPOS_PREGUNTA).map(
  ([value, { label, descripcion }]) => ({ value, label, descripcion })
);
