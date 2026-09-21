const TIPOS_PREGUNTA_VALIDOS = new Set([
  'opcion_multiple',
  'likert',
  'respuesta_corta',
  'respuesta_larga',
]);

const TIPOS_PREGUNTA_ABIERTOS = new Set(['respuesta_corta', 'respuesta_larga']);

function esTipoPreguntaValido(tipo) {
  return TIPOS_PREGUNTA_VALIDOS.has(tipo);
}

function esPreguntaAbierta(tipo) {
  return TIPOS_PREGUNTA_ABIERTOS.has(tipo);
}

module.exports = { esTipoPreguntaValido, esPreguntaAbierta };
