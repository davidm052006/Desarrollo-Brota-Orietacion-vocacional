-- Tabla para almacenar solicitudes del formulario de contacto
CREATE TABLE IF NOT EXISTS contactos (
  id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre      TEXT         NOT NULL,
  email       TEXT         NOT NULL,
  telefono    TEXT,
  asunto      TEXT         NOT NULL,
  mensaje     TEXT         NOT NULL,
  estado      TEXT         DEFAULT 'pendiente'
              CHECK (estado IN ('pendiente', 'leido', 'respondido', 'archivado')),
  notas_admin TEXT,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- Índice para filtrar por estado rápidamente
CREATE INDEX IF NOT EXISTS contactos_estado_idx ON contactos (estado);
CREATE INDEX IF NOT EXISTS contactos_created_at_idx ON contactos (created_at DESC);

-- RLS: solo el backend (SERVICE_ROLE) puede acceder
ALTER TABLE contactos ENABLE ROW LEVEL SECURITY;

-- Permitir insertar desde el backend (no hay acceso público desde el cliente)
CREATE POLICY "solo_service_role" ON contactos
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
