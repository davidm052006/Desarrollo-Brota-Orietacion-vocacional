-- ============================================================
-- MIGRACIÓN COMUNIDAD — Brota
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- Foros temáticos (categorizados)
CREATE TABLE IF NOT EXISTS foros (
  id        TEXT PRIMARY KEY,
  icon      TEXT NOT NULL,
  nombre    TEXT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts dentro de un foro
CREATE TABLE IF NOT EXISTS posts_foro (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  foro_id      TEXT NOT NULL REFERENCES foros(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo       TEXT NOT NULL,
  contenido    TEXT NOT NULL,
  anonimo      BOOLEAN DEFAULT FALSE,
  autor_nombre TEXT,
  votos        INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Votos en posts (evita duplicados por usuario)
CREATE TABLE IF NOT EXISTS votos_post (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES posts_foro(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  direccion  TEXT NOT NULL CHECK (direccion IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Respuestas a posts
CREATE TABLE IF NOT EXISTS respuestas_post (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id            UUID NOT NULL REFERENCES posts_foro(id) ON DELETE CASCADE,
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contenido          TEXT NOT NULL,
  anonimo            BOOLEAN DEFAULT FALSE,
  autor_nombre       TEXT,
  votos              INT DEFAULT 0,
  es_mejor_respuesta BOOLEAN DEFAULT FALSE,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Historias de usuarios (requieren moderación)
CREATE TABLE IF NOT EXISTS historias (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo       TEXT NOT NULL,
  contenido    TEXT NOT NULL,
  area         TEXT NOT NULL,
  carrera      TEXT,
  institucion  TEXT,
  anonimo      BOOLEAN DEFAULT TRUE,
  autor_nombre TEXT,
  publicada    BOOLEAN DEFAULT FALSE,
  likes        INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Likes en historias
CREATE TABLE IF NOT EXISTS likes_historia (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  historia_id UUID NOT NULL REFERENCES historias(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(historia_id, user_id)
);

-- Preguntas de la comunidad (publicadas inmediatamente)
CREATE TABLE IF NOT EXISTS preguntas_comunidad (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo       TEXT NOT NULL,
  area         TEXT NOT NULL DEFAULT 'General',
  anonimo      BOOLEAN DEFAULT FALSE,
  autor_nombre TEXT,
  resuelta     BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Respuestas a preguntas
CREATE TABLE IF NOT EXISTS respuestas_pregunta (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pregunta_id    UUID NOT NULL REFERENCES preguntas_comunidad(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contenido      TEXT NOT NULL,
  anonimo        BOOLEAN DEFAULT FALSE,
  autor_nombre   TEXT,
  votos          INT DEFAULT 0,
  es_mejor       BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Convocatorias (gestionadas por administradores)
CREATE TABLE IF NOT EXISTS convocatorias (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo        TEXT NOT NULL,
  titulo      TEXT NOT NULL,
  institucion TEXT NOT NULL,
  ciudad      TEXT NOT NULL DEFAULT 'Nacional',
  descripcion TEXT,
  detalles    JSONB DEFAULT '{}',
  url         TEXT,
  fecha_cierre TIMESTAMPTZ,
  activa      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Índices de rendimiento ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_posts_foro_foro_id     ON posts_foro(foro_id);
CREATE INDEX IF NOT EXISTS idx_posts_foro_created_at  ON posts_foro(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_votos_post_post_id     ON votos_post(post_id);
CREATE INDEX IF NOT EXISTS idx_respuestas_post_id     ON respuestas_post(post_id);
CREATE INDEX IF NOT EXISTS idx_historias_publicada    ON historias(publicada, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_historia_id      ON likes_historia(historia_id);
CREATE INDEX IF NOT EXISTS idx_preguntas_created_at   ON preguntas_comunidad(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resp_pregunta_id       ON respuestas_pregunta(pregunta_id);
CREATE INDEX IF NOT EXISTS idx_convocatorias_activa   ON convocatorias(activa, fecha_cierre);

-- ─── Seed foros ────────────────────────────────────────────────────────────────
INSERT INTO foros (id, icon, nombre, descripcion) VALUES
  ('tecnologia', '💻', 'Tecnología e informática',    'Sistemas, software, IA, telecomunicaciones y carreras digitales'),
  ('salud',      '🩺', 'Salud y ciencias de la vida', 'Medicina, enfermería, nutrición, odontología y áreas de la salud'),
  ('negocios',   '📊', 'Negocios y economía',          'Administración, economía, finanzas, marketing y emprendimiento'),
  ('artes',      '🎨', 'Artes y humanidades',          'Diseño, comunicación, bellas artes, filosofía y humanidades'),
  ('educacion',  '📚', 'Educación y pedagogía',        'Licenciaturas, pedagogía, docencia y ciencias de la educación'),
  ('ambiente',   '🌿', 'Ambiente y sostenibilidad',    'Ingeniería ambiental, biología, ecología y desarrollo sostenible')
ON CONFLICT (id) DO NOTHING;

-- ─── Seed convocatorias ────────────────────────────────────────────────────────
-- Guardado con IF NOT EXISTS de filas: este INSERT no tiene UNIQUE/ON CONFLICT
-- propio, así que se protege con el guard de abajo para poder re-ejecutar el
-- script completo sin duplicar las 5 convocatorias semilla.
DO $$
BEGIN
IF NOT EXISTS (SELECT 1 FROM convocatorias) THEN
INSERT INTO convocatorias (tipo, titulo, institucion, ciudad, detalles, url, fecha_cierre) VALUES
(
  'Beca',
  'Jóvenes en Acción — apoyo de sostenimiento',
  'Prosperidad Social',
  'Nacional',
  '{"requisitos": ["Ser colombiano/a beneficiario/a del programa", "Estar matriculado/a en un programa técnico o tecnológico del SENA o IES pública", "No haber recibido el beneficio anteriormente", "Pertenecer a los estratos 1 o 2", "Mantener rendimiento académico satisfactorio"], "pasos": [{"num": 1, "texto": "Verifica tu inscripción en la base de datos de Prosperidad Social"}, {"num": 2, "texto": "Actualiza tu información en el portal de prosperidadsocial.gov.co"}, {"num": 3, "texto": "Reporta tu matrícula activa en el sistema"}, {"num": 4, "texto": "Recibe el giro bimestral automáticamente"}]}',
  'https://prosperidadsocial.gov.co',
  NOW() + INTERVAL '3 days'
),
(
  'Beca',
  'Beca Saber Pa'' Pilo — matrícula completa',
  'ICETEX',
  'Nacional',
  '{"requisitos": ["Ser colombiano/a y estar matriculado/a en una IES acreditada", "Tener ICFES (Saber 11) con puntaje mínimo de 310 puntos", "Pertenecer a los estratos 1, 2 o 3", "No tener título de educación superior previo", "Mantener promedio acumulado igual o superior a 3.5"], "pasos": [{"num": 1, "texto": "Regístrate en el portal de ICETEX (icetex.gov.co)"}, {"num": 2, "texto": "Carga los documentos requeridos (ICFES, matrícula, certificado de estrato)"}, {"num": 3, "texto": "Diligencia el formulario de solicitud de beca antes de la fecha límite"}, {"num": 4, "texto": "Espera la notificación de preselección (15 días hábiles)"}, {"num": 5, "texto": "Entrevista virtual con el comité evaluador"}]}',
  'https://www.icetex.gov.co',
  NOW() + INTERVAL '4 days'
),
(
  'SENA',
  'Tecnólogo en Análisis de Datos',
  'SENA',
  'Bogotá',
  '{"requisitos": ["Ser bachiller (grado 11 aprobado o título)", "Mayor de 16 años al momento de inicio del programa", "No tener contrato laboral activo con empresa del sector"], "pasos": [{"num": 1, "texto": "Consulta la oferta de programas en el portal del SENA (sena.edu.co)"}, {"num": 2, "texto": "Regístrate como aprendiz y crea tu hoja de vida en Sofía Plus"}, {"num": 3, "texto": "Inscríbete al programa en las fechas de apertura"}, {"num": 4, "texto": "Realiza las pruebas de conocimiento si el cupo es limitado"}]}',
  'https://www.sena.edu.co',
  NOW() + INTERVAL '6 days'
),
(
  'Admisión',
  'Inscripciones pregrado 2026-2',
  'Universidad Nacional de Colombia',
  'Bogotá',
  '{"requisitos": ["Haber presentado el ICFES (Saber 11) en los últimos 5 años", "No tener título de pregrado de la Universidad Nacional", "Estar en los primeros puestos del listado de admitidos"], "pasos": [{"num": 1, "texto": "Ingresa al sistema de inscripción en dniaspiranteunal.unal.edu.co"}, {"num": 2, "texto": "Paga el valor de inscripción ($180.000 aprox.)"}, {"num": 3, "texto": "Presenta el examen de admisión en la fecha programada"}, {"num": 4, "texto": "Consulta resultados 30 días después del examen"}]}',
  'https://www.unal.edu.co',
  NOW() + INTERVAL '12 days'
),
(
  'Evento',
  'Feria de universidades — entrada libre',
  'Corferias',
  'Bogotá',
  '{"requisitos": ["Entrada libre para bachilleres y universitarios", "Llevar documento de identidad", "Registro previo recomendado para acceso prioritario"], "pasos": [{"num": 1, "texto": "Regístrate en el portal de la feria para acceso prioritario"}, {"num": 2, "texto": "Descarga tu entrada digital o recógela en taquilla"}, {"num": 3, "texto": "Asiste y recorre los stands de más de 80 instituciones"}, {"num": 4, "texto": "Participa en las charlas vocacionales y talleres gratuitos"}]}',
  'https://www.corferias.com',
  NOW() + INTERVAL '19 days'
);
END IF;
END $$;
