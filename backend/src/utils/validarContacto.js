// Reglas de POST /api/contacto. Viven fuera del controlador para probarlas
// con tests unitarios (tests/validarContacto.test.js).

const ASUNTOS_VALIDOS = [
  'Información general',
  'Soporte técnico',
  'Consulta sobre resultados',
  'Alianzas institucionales',
  'Otro',
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const OBLIGATORIOS = ['nombre', 'email', 'asunto', 'mensaje'];

/**
 * @returns {string|null} el mensaje del primer error, o null si es válido
 */
function validarContacto(cuerpo = {}) {
  const datos = cuerpo ?? {};

  // DEF-07: un campo que no es texto (p. ej. telefono: 3001234567) hacía
  // fallar .trim() en el controlador y respondía 500.
  for (const campo of [...OBLIGATORIOS, 'telefono']) {
    const valor = datos[campo];
    if (valor !== undefined && valor !== null && typeof valor !== 'string') {
      return 'Formato de datos inválido.';
    }
  }

  if (OBLIGATORIOS.some((campo) => !datos[campo]?.trim())) {
    return 'Campos requeridos incompletos.';
  }

  if (!EMAIL_REGEX.test(datos.email)) {
    return 'Correo electrónico inválido.';
  }

  if (!ASUNTOS_VALIDOS.includes(datos.asunto)) {
    return 'Asunto inválido.';
  }

  return null;
}

module.exports = { validarContacto, ASUNTOS_VALIDOS };
