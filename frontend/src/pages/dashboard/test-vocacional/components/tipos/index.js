// Registro tipo de pregunta -> componente que renderiza su cuerpo de opciones.
//
// TestQuestion.jsx (el dispatcher) resuelve acá con la clave ya normalizada por
// utils/tiposPregunta.js, así que las claves de este mapa son SIEMPRE las
// canónicas — nunca los alias legados (`single`, `seleccion`, `multiple`).
//
// Si se agrega un tipo nuevo a TIPOS_PREGUNTA, agregarle su entrada acá o el
// dispatcher cae al componente de `TIPO_POR_DEFECTO`.

import PreguntaOpcionUnica from './PreguntaOpcionUnica.jsx';
import PreguntaOpcionMultiple from './PreguntaOpcionMultiple.jsx';
import PreguntaLikert from './PreguntaLikert.jsx';

export const VISTAS_POR_TIPO = {
  opcion_unica:    PreguntaOpcionUnica,
  opcion_multiple: PreguntaOpcionMultiple,
  likert:          PreguntaLikert,
};

export default VISTAS_POR_TIPO;
