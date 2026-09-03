-- Bloqueo temporal de cuentas + permisos individuales por usuario (agosto 2026).
-- bloqueado_hasta: fecha hasta la que un admin bloqueó manualmente la cuenta
-- (NULL = no bloqueada). Distinto de `baneado_preguntas_hasta`, que es el ban
-- automático de 3 reportes en una pregunta de comunidad — este es manual, vía
-- panel admin, y aplica a toda la cuenta, no solo a preguntas.
-- permisos_override: excepciones puntuales sobre el default de PERMISOS_POR_ROL
-- (backend/src/utils/permisos.js), ej. { "comunidad.publicar": false }.
-- Ya incluida en backend/setup_database.sql para instalaciones nuevas —
-- este archivo es solo para aplicar el cambio a una base ya existente.
ALTER TABLE perfiles_usuario ADD COLUMN IF NOT EXISTS bloqueado_hasta TIMESTAMPTZ;
ALTER TABLE perfiles_usuario ADD COLUMN IF NOT EXISTS permisos_override JSONB DEFAULT '{}';
