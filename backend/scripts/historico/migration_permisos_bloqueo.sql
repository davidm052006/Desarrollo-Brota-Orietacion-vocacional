ALTER TABLE perfiles_usuario
  ADD COLUMN bloqueado_hasta TIMESTAMPTZ,
  ADD COLUMN permisos_override JSONB DEFAULT '{}';