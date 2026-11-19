// Responde un 500 sin filtrar detalles internos al cliente (DEF-04).
// El error completo (mensaje de Supabase/Postgres, stack) solo va al log
// del servidor; el cliente recibe siempre el mismo mensaje genérico.
const MENSAJE_ERROR_INTERNO = 'Error interno del servidor';

function responderErrorInterno(res, label, err) {
  console.error(`${label}:`, err);
  return res.status(500).json({ success: false, message: MENSAJE_ERROR_INTERNO });
}

module.exports = { responderErrorInterno, MENSAJE_ERROR_INTERNO };
