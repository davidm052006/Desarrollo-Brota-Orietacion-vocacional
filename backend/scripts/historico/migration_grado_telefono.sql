-- Campos "grado" y "telefono" en perfiles_usuario (agosto 2026)
-- El registro público (SignupCard.jsx) ya los pedía y los mandaba al backend,
-- pero authController.registerPerfil los descartaba en silencio (nunca hubo
-- columna donde guardarlos). Se agregan ahora para que ese dato deje de
-- perderse y para que la creación de usuarios desde el panel admin
-- (individual y carga masiva) pueda capturar el mismo formato que el
-- registro real.
-- Ya incluida en backend/setup_database.sql para instalaciones nuevas —
-- este archivo es solo para aplicar el cambio a una base ya existente.
ALTER TABLE perfiles_usuario ADD COLUMN IF NOT EXISTS grado VARCHAR(50);
ALTER TABLE perfiles_usuario ADD COLUMN IF NOT EXISTS telefono VARCHAR(50);
