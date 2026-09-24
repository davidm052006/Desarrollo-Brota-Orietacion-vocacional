// ============================================================
// authErrors.js
// Traducción de errores de Supabase Auth al español.
//
// PROBLEMA QUE RESUELVE: Supabase devuelve errores en inglés
// como "Invalid login credentials". Sin esta capa, ese texto
// llegaría directo al usuario final.
//
// CÓMO FUNCIONA: busca si el mensaje de error contiene alguna
// de las frases clave del mapa. Si hay coincidencia, devuelve
// la traducción. Si no, devuelve un mensaje genérico seguro.
//
// PARA AGREGAR UN ERROR NUEVO: simplemente agrega una línea al
// objeto AUTH_ERRORS con la frase en inglés (en minúsculas) y
// su traducción al español.
//
// USADO EN: authService.js (después de cada llamada a Supabase)
// ============================================================

/**
 * Mapa de fragmentos de mensajes de error de Supabase → español.
 * Las claves deben estar en minúsculas (se compara con .toLowerCase()).
 */
const AUTH_ERRORS = {
  // Credenciales incorrectas al iniciar sesión
  'invalid login credentials': 'Correo o contraseña incorrectos.',
  'invalid email or password': 'Correo o contraseña incorrectos.',
  'invalid credential':        'Correo o contraseña incorrectos.',

  // El usuario no confirmó su correo (Supabase puede requerir verificación)
  'email not confirmed': 'Debes confirmar tu correo antes de iniciar sesión.',

  // Intento de registrar un correo que ya existe
  'user already registered': 'Este correo ya está registrado. Intenta iniciar sesión.',
  'email already in use':    'Este correo ya está en uso.',

  // Correo no encontrado en recuperación de contraseña
  'user not found': 'No encontramos una cuenta con ese correo.',

  // Contraseña muy débil (Supabase puede tener reglas configuradas)
  'password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
  'weak password': 'La contraseña es demasiado débil. Usa al menos 6 caracteres.',

  // Formato de correo inválido (validación del lado del servidor)
  'email address is invalid': 'El correo ingresado no es válido.',

  // Rate limiting — demasiados intentos en poco tiempo
  'too many requests': 'Demasiados intentos. Espera unos minutos antes de intentarlo de nuevo.',
  'rate limit':        'Demasiados intentos. Espera unos minutos.',

  // Problemas de red o de conexión al servidor
  'network error': 'Error de conexión. Revisa tu internet e intenta de nuevo.',
  'fetch failed': 'No se pudo conectar al servidor. Revisa tu internet.',
  'failed to fetch': 'No se pudo conectar al servicio de autenticación. Revisa tu internet o intenta más tarde.',
  'err_name_not_resolved': 'No se pudo resolver la dirección del servicio de autenticación. Verifica la conexión o intenta más tarde.',
  'network request failed': 'No se pudo conectar al servicio de autenticación. Verifica tu conexión e intenta de nuevo.',

  // Sesión expirada (token JWT vencido)
  'jwt expired':   'Tu sesión expiró. Inicia sesión de nuevo.',
  'token expired': 'Tu sesión expiró. Inicia sesión de nuevo.',
};

/**
 * Traduce un mensaje de error de Supabase al español.
 *
 * @param {string} originalMessage - Mensaje en inglés devuelto por Supabase
 * @returns {string} Mensaje en español listo para mostrar al usuario
 *
 * @example
 * translateAuthError("Invalid login credentials")
 * // → "Correo o contraseña incorrectos."
 *
 * translateAuthError(null)
 * // → "Ocurrió un error. Intenta nuevamente."
 */
export const translateAuthError = (originalMessage) => {
  if (!originalMessage) return 'Ocurrió un error. Intenta nuevamente.';

  const lower = originalMessage.toLowerCase();

  // Recorre el mapa buscando si el mensaje contiene alguna clave conocida
  for (const [key, translation] of Object.entries(AUTH_ERRORS)) {
    if (lower.includes(key)) return translation;
  }

  // Si no hay coincidencia, mensaje genérico (no expone detalles técnicos)
  return 'Ocurrió un error. Intenta nuevamente.';
};