-- ============================================================
-- MIGRACIÓN RACHA DE USUARIO — Brota
-- Ejecutar en el SQL Editor de Supabase (o vía psql)
-- ============================================================

-- Antes la racha del dashboard estaba hardcodeada en 3 días.
-- Se calcula en perfilController.obtenerPerfil: si ultima_actividad fue
-- ayer, racha_dias += 1; si fue hoy, no cambia; si fue antes o es null,
-- racha_dias vuelve a 1.
ALTER TABLE perfiles_usuario ADD COLUMN IF NOT EXISTS ultima_actividad DATE;
ALTER TABLE perfiles_usuario ADD COLUMN IF NOT EXISTS racha_dias INT DEFAULT 0;
