-- ============================================================
-- MIGRACIÓN BLOQUEO DE USUARIOS (Panel Admin) — Brota
-- Ejecutar en el SQL Editor de Supabase (o vía psql)
-- ============================================================

-- Bloqueo temporal desde el panel admin (Fase 2A — Julian): un admin puede
-- suspender el acceso de un usuario hasta una fecha determinada. Mismo patrón
-- que baneado_preguntas_hasta (migration_reportes_preguntas.sql), pero ese
-- campo solo restringe crear preguntas de comunidad; este es un bloqueo
-- general gestionado manualmente desde ModalPermisosUsuario.jsx, no
-- automático por reportes.
ALTER TABLE perfiles_usuario ADD COLUMN IF NOT EXISTS bloqueado_hasta TIMESTAMPTZ;