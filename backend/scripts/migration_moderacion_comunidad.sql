-- Rol "moderador" + capacidad de ocultar publicaciones de comunidad
-- (además de eliminarlas, que ya se podía por hard-delete). Ver
-- backend/src/middlewares/verificarModeracion.js y
-- backend/src/controllers/comunidad/moderacionController.js.
--
-- `rol` en perfiles_usuario es VARCHAR libre, sin CHECK constraint (ver
-- setup_database.sql) — 'moderador' no necesita nada especial acá, se
-- asigna igual que 'admin'/'orientador' desde el panel admin.

ALTER TABLE posts_foro         ADD COLUMN IF NOT EXISTS oculta BOOLEAN DEFAULT false;
ALTER TABLE historias          ADD COLUMN IF NOT EXISTS oculta BOOLEAN DEFAULT false;
ALTER TABLE preguntas_comunidad ADD COLUMN IF NOT EXISTS oculta BOOLEAN DEFAULT false;
