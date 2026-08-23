-- Personalización de la mascota "Broti" (agosto 2026)
-- Ya incluida en backend/setup_database.sql para instalaciones nuevas —
-- este archivo es solo para aplicar el cambio a una base ya existente.
ALTER TABLE perfiles_usuario ADD COLUMN IF NOT EXISTS broti_config JSONB DEFAULT '{}';
