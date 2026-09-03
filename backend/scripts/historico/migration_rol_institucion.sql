-- Rol "institucion" (agosto 2026): cuentas que representan una institución
-- educativa del catálogo (tabla `instituciones`, poblada por la sync MEN).
--
-- institucion_id: vínculo al catálogo. ON DELETE SET NULL a propósito — la
-- sync MEN borra y recrea TODA la tabla `instituciones` con UUIDs nuevos en
-- cada corrida (ver sincronizacionController.js), así que después de una
-- sync las cuentas institución quedan desvinculadas y hay que re-vincularlas
-- a mano desde el panel admin. Mismo tipo de trade-off ya aceptado para
-- `recomendaciones` (bug #3 en CLAUDE.md) — aceptado a propósito para v1,
-- no perseguirlo como bug.
-- institucion_contacto / institucion_descripcion: el "cuestionario" propio
-- que la cuenta institución completa en su primer ingreso (distinto del
-- formulario de registro de estudiantes) — reutiliza la columna `telefono`
-- que ya existe en perfiles_usuario para el teléfono de contacto.
-- Ya incluida en backend/setup_database.sql para instalaciones nuevas —
-- este archivo es solo para aplicar el cambio a una base ya existente.
ALTER TABLE perfiles_usuario ADD COLUMN IF NOT EXISTS institucion_id UUID REFERENCES instituciones(id) ON DELETE SET NULL;
ALTER TABLE perfiles_usuario ADD COLUMN IF NOT EXISTS institucion_contacto TEXT;
ALTER TABLE perfiles_usuario ADD COLUMN IF NOT EXISTS institucion_descripcion TEXT;
