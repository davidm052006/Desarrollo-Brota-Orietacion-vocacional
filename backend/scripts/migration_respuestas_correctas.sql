-- Agrega soporte opcional para preguntas evaluativas en cuestionarios.
-- Las preguntas sin opciones marcadas siguen funcionando como antes.
ALTER TABLE opciones
  ADD COLUMN IF NOT EXISTS es_correcta BOOLEAN NOT NULL DEFAULT FALSE;
