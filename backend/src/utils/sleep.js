// Pausa simple entre filas de una carga masiva — margen de seguridad contra
// un posible rate limit de Supabase Auth (admin.createUser), que no
// documenta límites propios para el Admin API pero sí usa infraestructura
// de rate limiting por IP para el resto de auth — y todas nuestras llamadas
// salen de la misma IP (el backend). Ver admin/usuariosController.js e
// institucion/usuariosController.js.
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = sleep;
