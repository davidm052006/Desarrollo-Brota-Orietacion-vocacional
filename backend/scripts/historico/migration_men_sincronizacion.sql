CREATE TABLE IF NOT EXISTS men_sincronizacion (
  id                       SERIAL PRIMARY KEY,
  ejecutada_en             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  remote_timestamp         BIGINT,
  programas_importados     INTEGER NOT NULL DEFAULT 0,
  instituciones_importadas INTEGER NOT NULL DEFAULT 0,
  estado                   TEXT NOT NULL DEFAULT 'exitosa',
  error                    TEXT
);

ALTER TABLE men_sincronizacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solo backend puede leer sincronizacion"
  ON men_sincronizacion FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Solo backend puede insertar sincronizacion"
  ON men_sincronizacion FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
