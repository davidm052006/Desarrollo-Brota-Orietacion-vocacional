// Registro tipo de pregunta -> componente que renderiza su cuerpo de opciones.
//
// TestQuestion.jsx (el dispatcher) resuelve acá con la clave ya normalizada por
// utils/tiposPregunta.js, así que las claves de este mapa son SIEMPRE las
// canónicas — nunca los alias legados (`single`, `seleccion`, `multiple`).
//
// Hoy apunta a las vistas provisionales de `placeholders.jsx`; cuando estén las
// definitivas basta cambiar estos tres imports (y borrar placeholders.jsx).
// Si se agrega un tipo nuevo a TIPOS_PREGUNTA, agregarle su entrada acá o el
// dispatcher cae al componente de `TIPO_POR_DEFECTO`.

import {
  PlaceholderOpcionUnica,
  PlaceholderOpcionMultiple,
  PlaceholderLikert,
} from './placeholders.jsx';

export const VISTAS_POR_TIPO = {
  opcion_unica:    PlaceholderOpcionUnica,
  opcion_multiple: PlaceholderOpcionMultiple,
  likert:          PlaceholderLikert,
};

export default VISTAS_POR_TIPO;
