// Espejo CommonJS de frontend/src/utils/tiposPregunta.js — mismo criterio que
// utils/calcularEdad.js (una copia por runtime, un solo comentario que las ata).
// Si se agrega o renombra un tipo, tocar los dos archivos.
//
// Acá se usa para validar `preguntas.tipo` en los dos CRUD (admin e institución)
// antes de escribir: tipo desconocido → 400, alias legado → se normaliza a la
// clave canónica, para que la columna deje de ensuciarse con cinco vocabularios.

const TIPOS_PREGUNTA = {
  opcion_unica: {
    label: 'Opción única',
    multiple: false,
    descripcion: 'El estudiante elige una sola opción entre varias tarjetas.',
  },
  opcion_multiple: {
    label: 'Opción múltiple',
    multiple: true,
    descripcion: 'El estudiante puede marcar todas las opciones que apliquen.',
  },
  likert: {
    label: 'Escala Likert',
    multiple: false,
    descripcion: 'Escala gráfica de 5 puntos, de menor a mayor afinidad.',
  },
};

const TIPO_POR_DEFECTO = 'opcion_unica';

// Valores legados que siguen vivos en filas ya guardadas.
const ALIAS = {
  single: 'opcion_unica',
  seleccion: 'opcion_unica',
  multiple: 'opcion_multiple',
};

/** Traduce un valor de `preguntas.tipo` (canónico o legado) a la clave canónica. */
function normalizarTipo(tipo) {
  if (typeof tipo === 'string') {
    const clave = tipo.trim().toLowerCase();
    if (clave in TIPOS_PREGUNTA) return clave;
    if (clave in ALIAS) return ALIAS[clave];
  }
  return TIPO_POR_DEFECTO;
}

/** true si el tipo (canónico o alias) es uno de los que conocemos. */
function esTipoValido(tipo) {
  if (typeof tipo !== 'string') return false;
  const clave = tipo.trim().toLowerCase();
  return clave in TIPOS_PREGUNTA || clave in ALIAS;
}

/** true si el tipo admite varias opciones seleccionadas a la vez. */
function esSeleccionMultiple(tipo) {
  return TIPOS_PREGUNTA[normalizarTipo(tipo)].multiple;
}

/** Mensaje de error 400 uniforme entre los dos controllers. */
const TIPOS_VALIDOS = Object.keys(TIPOS_PREGUNTA);
function mensajeTipoInvalido(tipo) {
  return `Tipo de pregunta inválido: "${tipo}". Valores aceptados: ${TIPOS_VALIDOS.join(', ')}.`;
}

module.exports = {
  TIPOS_PREGUNTA,
  TIPOS_VALIDOS,
  TIPO_POR_DEFECTO,
  normalizarTipo,
  esTipoValido,
  esSeleccionMultiple,
  mensajeTipoInvalido,
};
