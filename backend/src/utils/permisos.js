// Default de recursos permitidos por rol. Un usuario puede tener excepciones
// puntuales en `perfiles_usuario.permisos_override` (JSONB, ej.
// { "comunidad.publicar": false }) que pisan este default para ese usuario
// específico — ver tienePermiso().
//
// Esto NO reemplaza a verificarAdmin.js/verificarModeracion.js (acceso al
// panel admin / herramientas de moderación siguen siendo esos dos checks de
// rol fijo). Es para recursos más finos que necesiten poder apagarse para un
// usuario puntual sin tocar código.
const PERMISOS_POR_ROL = {
  estudiante: ['comunidad.publicar', 'comunidad.comentar'],
  orientador: ['comunidad.publicar', 'comunidad.comentar'],
  moderador:  ['comunidad.publicar', 'comunidad.comentar'],
  admin:      ['comunidad.publicar', 'comunidad.comentar', 'programas.editar'],
};

const RECURSOS_VALIDOS = [...new Set(Object.values(PERMISOS_POR_ROL).flat())];

// perfil: fila de perfiles_usuario (necesita al menos `rol` y `permisos_override`)
function tienePermiso(perfil, recurso) {
  const override = perfil?.permisos_override?.[recurso];
  if (override !== undefined) return Boolean(override);
  return (PERMISOS_POR_ROL[perfil?.rol] || []).includes(recurso);
}

module.exports = { PERMISOS_POR_ROL, RECURSOS_VALIDOS, tienePermiso };
