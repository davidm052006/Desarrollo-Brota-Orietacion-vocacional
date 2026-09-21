export const TIPOS_PREGUNTA = [
  { value: 'opcion_multiple', label: 'Opción múltiple', abierta: false },
  { value: 'likert', label: 'Escala Likert', abierta: false },
  { value: 'respuesta_corta', label: 'Respuesta corta', abierta: true },
  { value: 'respuesta_larga', label: 'Respuesta larga', abierta: true },
];

export const TIPOS_ABIERTOS = new Set(
  TIPOS_PREGUNTA.filter(tipo => tipo.abierta).map(tipo => tipo.value),
);

export const esPreguntaAbierta = tipo => TIPOS_ABIERTOS.has(tipo);

export const esPreguntaUnica = tipo => tipo === 'likert' || tipo === 'single';
