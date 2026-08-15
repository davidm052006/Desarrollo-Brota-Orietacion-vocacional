-- ============================================================
-- MIGRACIÓN REPORTES DE PREGUNTAS — Brota
-- Ejecutar en el SQL Editor de Supabase (o vía psql)
-- ============================================================

-- Reportes de preguntas de comunidad (moderación por usuarios)
CREATE TABLE IF NOT EXISTS reportes_pregunta (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pregunta_id UUID NOT NULL REFERENCES preguntas_comunidad(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  motivo      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pregunta_id, user_id) -- un usuario no puede reportar la misma pregunta dos veces
);

CREATE INDEX IF NOT EXISTS idx_reportes_pregunta_id ON reportes_pregunta(pregunta_id);

-- Ban temporal: cuando una pregunta llega a 3 reportes, se prohíbe al autor
-- crear preguntas nuevas hasta esta fecha (ver preguntasController.crearPregunta).
ALTER TABLE perfiles_usuario ADD COLUMN IF NOT EXISTS baneado_preguntas_hasta TIMESTAMPTZ;
