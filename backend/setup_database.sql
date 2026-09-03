-- ============================================================
-- BROTA — ESQUEMA COMPLETO DE BASE DE DATOS (Supabase / Postgres)
-- ============================================================
-- Consolidado agosto 2026: antes esto vivía repartido en 9 archivos
-- migration_*.sql que se fueron corriendo uno por uno a medida que se
-- agregaban features. Todos esos deltas ya están fusionados acá, en
-- orden de dependencias, en un solo script idempotente — correr esto
-- una vez alcanza para levantar el esquema completo desde cero en un
-- proyecto Supabase nuevo. Los migration_*.sql individuales se movieron
-- a backend/scripts/historico/ (se conservan solo como registro de qué
-- se corrió y cuándo contra la base real — no hace falta volver a
-- correrlos, ni por separado ni en orden).
--
-- Todo `CREATE TABLE`/`ADD COLUMN`/`CREATE POLICY` de acá es seguro de
-- re-ejecutar (IF NOT EXISTS / DROP POLICY IF EXISTS + CREATE) — pero
-- este script asume una base NUEVA. Contra la base real de producción
-- de Brota no hace falta correrlo: ya está aplicado (ver historico/).
--
-- Ejecutar en el SQL Editor de Supabase, de una sola vez.

-- ============================================================
-- EXTENSIONES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- NÚCLEO: usuarios y test vocacional
-- ============================================================

-- El rol vive directamente como texto ('estudiante' | 'orientador' |
-- 'moderador' | 'admin'), no como FK a una tabla `roles` separada — así
-- lo leen/escriben authController.js, los controllers de admin/comunidad,
-- y verificarAdmin.js / verificarModeracion.js.
CREATE TABLE IF NOT EXISTS perfiles_usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rol VARCHAR(50) DEFAULT 'estudiante',
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  edad INTEGER CHECK (edad >= 14 AND edad <= 100),
  ciudad VARCHAR(100),
  nivel_educativo VARCHAR(100),
  condiciones_socioeconomicas JSONB DEFAULT '{}',
  -- Mismo formato que pide el registro público (SignupCard.jsx) — agregadas
  -- agosto 2026 para que la creación desde el panel admin (individual y carga
  -- masiva) capture lo mismo que el registro real, no solo un subconjunto
  grado VARCHAR(50),
  telefono VARCHAR(50),
  -- Racha de días activos (agosto 2026, antes hardcodeada en 3 en el frontend)
  ultima_actividad DATE,
  racha_dias INT DEFAULT 0,
  -- Ban temporal de 7 días al llegar a 3 reportes en una pregunta de comunidad
  baneado_preguntas_hasta TIMESTAMPTZ,
  -- Bloqueo general gestionado manualmente por un admin desde el panel
  -- (Fase 2A — Julian, ver migration_bloqueo_usuarios.sql). Distinto de
  -- baneado_preguntas_hasta: este bloquea el acceso, no solo preguntas.
  bloqueado_hasta TIMESTAMPTZ,
  -- Personalización de la mascota "Broti" — { lentes: 'redondos', fondo: 'bosque', ... }
  -- ver frontend/src/utils/brotiCatalog.js (agosto 2026)
  broti_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS cuestionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(200) NOT NULL,
  version VARCHAR(50) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS preguntas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuestionario_id UUID REFERENCES cuestionarios(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  orden INTEGER NOT NULL,
  categoria VARCHAR(100),
  peso DECIMAL(3,2) DEFAULT 1.0,
  opciones JSONB DEFAULT '[]', -- legado, las opciones reales viven en la tabla `opciones`
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS opciones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pregunta_id UUID REFERENCES preguntas(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  icon        TEXT,
  orden       INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pesos_opciones (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opcion_id  UUID REFERENCES opciones(id) ON DELETE CASCADE,
  categoria  TEXT NOT NULL,  -- 'tecnologia', 'diseño', 'negocios', etc.
  puntos     INTEGER NOT NULL DEFAULT 1 CHECK (puntos > 0)
);

CREATE TABLE IF NOT EXISTS resultados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_usuario_id UUID REFERENCES perfiles_usuario(id) ON DELETE CASCADE,
  cuestionario_id UUID REFERENCES cuestionarios(id) ON DELETE CASCADE,
  respuestas JSONB NOT NULL DEFAULT '{}',
  perfil_vocacional JSONB DEFAULT '{}',
  fecha_realizacion TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Oferta educativa
-- ============================================================

CREATE TABLE IF NOT EXISTS instituciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(200) NOT NULL,
  tipo VARCHAR(100),
  ciudad VARCHAR(100),
  departamento VARCHAR(100),
  direccion TEXT,
  telefono VARCHAR(50),
  email VARCHAR(100),
  sitio_web TEXT,
  costo_promedio INTEGER,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS programas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institucion_id UUID REFERENCES instituciones(id) ON DELETE CASCADE,
  nombre VARCHAR(200) NOT NULL,
  tipo VARCHAR(100),
  area_academica VARCHAR(100),
  categoria TEXT, -- legado, ver bug #4 en CLAUDE.md (NULL en ~9% de programas: dato "Sin clasificar" en la fuente del MEN)
  duracion VARCHAR(100),
  modalidad VARCHAR(50),
  descripcion TEXT,
  requisitos TEXT,
  costo_matricula INTEGER,
  perfil_compatible JSONB DEFAULT '{}',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sincronizado desde la API del MEN (datos.gov.co) — ver sincronizacionController.js
CREATE TABLE IF NOT EXISTS men_sincronizacion (
  id                       SERIAL PRIMARY KEY,
  ejecutada_en             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  remote_timestamp         BIGINT,
  programas_importados     INTEGER NOT NULL DEFAULT 0,
  instituciones_importadas INTEGER NOT NULL DEFAULT 0,
  estado                   TEXT NOT NULL DEFAULT 'exitosa',
  error                    TEXT
);

CREATE TABLE IF NOT EXISTS recomendaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programa_id UUID REFERENCES programas(id) ON DELETE CASCADE,
  resultado_id UUID REFERENCES resultados(id) ON DELETE CASCADE,
  compatibilidad DECIMAL(5,2) CHECK (compatibilidad >= 0 AND compatibilidad <= 100),
  razones TEXT, -- JSON serializado como texto, ver bug #2 en CLAUDE.md
  vista BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Comunidad
-- ============================================================

CREATE TABLE IF NOT EXISTS foros (
  id        TEXT PRIMARY KEY,
  icon      TEXT NOT NULL,
  nombre    TEXT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts_foro (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  foro_id      TEXT NOT NULL REFERENCES foros(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo       TEXT NOT NULL,
  contenido    TEXT NOT NULL,
  anonimo      BOOLEAN DEFAULT FALSE,
  autor_nombre TEXT,
  votos        INT DEFAULT 0,
  oculta       BOOLEAN DEFAULT false, -- moderación (agosto 2026): ocultar sin borrar
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS votos_post (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES posts_foro(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  direccion  TEXT NOT NULL CHECK (direccion IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

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
  publicada    BOOLEAN DEFAULT FALSE, -- requiere moderación antes de mostrarse
  oculta       BOOLEAN DEFAULT false, -- moderación (agosto 2026): ocultar sin borrar
  likes        INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS likes_historia (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  historia_id UUID NOT NULL REFERENCES historias(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(historia_id, user_id)
);

CREATE TABLE IF NOT EXISTS preguntas_comunidad (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo       TEXT NOT NULL,
  area         TEXT NOT NULL DEFAULT 'General',
  anonimo      BOOLEAN DEFAULT FALSE,
  autor_nombre TEXT,
  resuelta     BOOLEAN DEFAULT FALSE,
  oculta       BOOLEAN DEFAULT false, -- moderación (agosto 2026): ocultar sin borrar
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

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

-- Reportes de preguntas (moderación por usuarios — no confundir con la
-- moderación admin/moderador de arriba). A los 3 reportes se banea al
-- autor 7 días para crear preguntas nuevas (preguntasController.reportarPregunta).
CREATE TABLE IF NOT EXISTS reportes_pregunta (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pregunta_id UUID NOT NULL REFERENCES preguntas_comunidad(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  motivo      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pregunta_id, user_id)
);

-- Esquema real de producción — OJO: distinto al que tenía este archivo
-- antes de agosto 2026 (programa_id/fecha_apertura/cupos), que nunca
-- llegó a usarse. Este es el que de verdad lee/escribe convocatoriasController.js.
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

-- Solicitudes del formulario público de contacto
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

-- ============================================================
-- Rutas formativas
-- ============================================================
-- Contenido estático por área académica (mismas 14 claves que ya usan
-- Profesiones.jsx / TestResult.jsx / vocacionalCategorias.js). Curado a
-- mano una sola vez, sin scraping ni llamadas en vivo a un LLM — ver
-- backend/scripts/historico/migration_rutas.sql para el detalle de cómo
-- se armó el contenido si hace falta revisar el proceso.
CREATE TABLE IF NOT EXISTS contenido_rutas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area              TEXT UNIQUE NOT NULL,
  materias_comunes  JSONB NOT NULL DEFAULT '[]',
  temas_previos     JSONB NOT NULL DEFAULT '[]',
  proyectos         JSONB NOT NULL DEFAULT '[]',
  recursos          JSONB NOT NULL DEFAULT '[]', -- [{ "titulo": "...", "url": "..." }]
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_perfiles_user_id        ON perfiles_usuario(user_id);
CREATE INDEX IF NOT EXISTS idx_programas_institucion    ON programas(institucion_id);
CREATE INDEX IF NOT EXISTS idx_programas_categoria      ON programas(categoria);
CREATE INDEX IF NOT EXISTS idx_preguntas_cuestionario   ON preguntas(cuestionario_id);
CREATE INDEX IF NOT EXISTS idx_resultados_perfil        ON resultados(perfil_usuario_id);
CREATE INDEX IF NOT EXISTS idx_recomendaciones_resultado ON recomendaciones(resultado_id);
CREATE INDEX IF NOT EXISTS idx_opciones_pregunta        ON opciones(pregunta_id);
CREATE INDEX IF NOT EXISTS idx_pesos_opcion             ON pesos_opciones(opcion_id);
CREATE INDEX IF NOT EXISTS idx_posts_foro_foro_id       ON posts_foro(foro_id);
CREATE INDEX IF NOT EXISTS idx_posts_foro_created_at    ON posts_foro(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_votos_post_post_id       ON votos_post(post_id);
CREATE INDEX IF NOT EXISTS idx_respuestas_post_id       ON respuestas_post(post_id);
CREATE INDEX IF NOT EXISTS idx_historias_publicada      ON historias(publicada, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_historia_id        ON likes_historia(historia_id);
CREATE INDEX IF NOT EXISTS idx_preguntas_created_at     ON preguntas_comunidad(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resp_pregunta_id         ON respuestas_pregunta(pregunta_id);
CREATE INDEX IF NOT EXISTS idx_reportes_pregunta_id     ON reportes_pregunta(pregunta_id);
CREATE INDEX IF NOT EXISTS idx_convocatorias_activa     ON convocatorias(activa, fecha_cierre);
CREATE INDEX IF NOT EXISTS contactos_estado_idx         ON contactos(estado);
CREATE INDEX IF NOT EXISTS contactos_created_at_idx     ON contactos(created_at DESC);

-- ============================================================
-- TRIGGERS updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_perfiles_usuario_updated_at BEFORE UPDATE ON perfiles_usuario
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_instituciones_updated_at BEFORE UPDATE ON instituciones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_programas_updated_at BEFORE UPDATE ON programas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cuestionarios_updated_at BEFORE UPDATE ON cuestionarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FUNCIONES RPC — contadores atómicos
-- ============================================================
-- Por qué: leer votos -> calcular en JS -> escribir puede perder una
-- actualización bajo dos requests concurrentes. Un solo UPDATE con la
-- aritmética adentro es atómico a nivel de fila en Postgres.
CREATE OR REPLACE FUNCTION public.incrementar_votos_post(post_id_param UUID, delta INT)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  nuevo_valor INT;
BEGIN
  UPDATE posts_foro
  SET votos = COALESCE(votos, 0) + delta
  WHERE id = post_id_param
  RETURNING votos INTO nuevo_valor;
  RETURN nuevo_valor;
END;
$$;

CREATE OR REPLACE FUNCTION public.incrementar_likes_historia(historia_id_param UUID, delta INT)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  nuevo_valor INT;
BEGIN
  UPDATE historias
  SET likes = GREATEST(0, COALESCE(likes, 0) + delta)
  WHERE id = historia_id_param
  RETURNING likes INTO nuevo_valor;
  RETURN nuevo_valor;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Núcleo (usuarios/test/oferta educativa): policies originales del MVP,
-- de lectura pública para catálogos + auth.uid() para datos propios del
-- usuario — el frontend SÍ lee estas directo con el cliente anon
-- (confirmado: AdminPanel.jsx, useAdmin.js, useModeracion.js consultan
-- perfiles_usuario así). Distinto del patrón "solo_service_role" de
-- comunidad/contactos/rutas, donde todo pasa por el backend.
ALTER TABLE perfiles_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE instituciones    ENABLE ROW LEVEL SECURITY;
ALTER TABLE programas        ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuestionarios    ENABLE ROW LEVEL SECURITY;
ALTER TABLE preguntas        ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados       ENABLE ROW LEVEL SECURITY;
ALTER TABLE recomendaciones  ENABLE ROW LEVEL SECURITY;
ALTER TABLE opciones         ENABLE ROW LEVEL SECURITY;
ALTER TABLE pesos_opciones   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON perfiles_usuario;
CREATE POLICY "Usuarios pueden ver su propio perfil" ON perfiles_usuario FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON perfiles_usuario;
CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON perfiles_usuario FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Usuarios pueden insertar su propio perfil" ON perfiles_usuario;
CREATE POLICY "Usuarios pueden insertar su propio perfil" ON perfiles_usuario FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Todos pueden ver instituciones activas" ON instituciones;
CREATE POLICY "Todos pueden ver instituciones activas" ON instituciones FOR SELECT USING (activa = true);
DROP POLICY IF EXISTS "Todos pueden ver programas activos" ON programas;
CREATE POLICY "Todos pueden ver programas activos" ON programas FOR SELECT USING (activo = true);
DROP POLICY IF EXISTS "Todos pueden ver cuestionarios activos" ON cuestionarios;
CREATE POLICY "Todos pueden ver cuestionarios activos" ON cuestionarios FOR SELECT USING (activo = true);
DROP POLICY IF EXISTS "Todos pueden ver preguntas" ON preguntas;
CREATE POLICY "Todos pueden ver preguntas" ON preguntas FOR SELECT USING (true);
DROP POLICY IF EXISTS "Todos pueden ver opciones" ON opciones;
CREATE POLICY "Todos pueden ver opciones" ON opciones FOR SELECT USING (true);
DROP POLICY IF EXISTS "Todos pueden ver pesos" ON pesos_opciones;
CREATE POLICY "Todos pueden ver pesos" ON pesos_opciones FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuarios pueden ver sus propios resultados" ON resultados;
CREATE POLICY "Usuarios pueden ver sus propios resultados" ON resultados
  FOR SELECT USING (perfil_usuario_id IN (SELECT id FROM perfiles_usuario WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios resultados" ON resultados;
CREATE POLICY "Usuarios pueden insertar sus propios resultados" ON resultados
  FOR INSERT WITH CHECK (perfil_usuario_id IN (SELECT id FROM perfiles_usuario WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Usuarios pueden ver sus propias recomendaciones" ON recomendaciones;
CREATE POLICY "Usuarios pueden ver sus propias recomendaciones" ON recomendaciones
  FOR SELECT USING (
    resultado_id IN (
      SELECT id FROM resultados WHERE perfil_usuario_id IN (
        SELECT id FROM perfiles_usuario WHERE user_id = auth.uid()
      )
    )
  );

-- men_sincronizacion: solo backend
ALTER TABLE men_sincronizacion ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Solo backend puede leer sincronizacion" ON men_sincronizacion;
CREATE POLICY "Solo backend puede leer sincronizacion" ON men_sincronizacion FOR SELECT USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Solo backend puede insertar sincronizacion" ON men_sincronizacion;
CREATE POLICY "Solo backend puede insertar sincronizacion" ON men_sincronizacion FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Comunidad + contactos + convocatorias + rutas: todo pasa por el backend
-- con SUPABASE_SERVICE_KEY (bypassea RLS siempre) — el frontend nunca hace
-- .from() directo sobre estas, solo supabase.auth.*.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'foros', 'posts_foro', 'votos_post', 'respuestas_post',
    'historias', 'likes_historia', 'preguntas_comunidad', 'respuestas_pregunta',
    'reportes_pregunta', 'convocatorias', 'contactos', 'contenido_rutas'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "solo_service_role" ON %I', t);
    EXECUTE format('CREATE POLICY "solo_service_role" ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

-- ============================================================
-- SEEDS
-- ============================================================

INSERT INTO foros (id, icon, nombre, descripcion) VALUES
  ('tecnologia', '💻', 'Tecnología e informática',    'Sistemas, software, IA, telecomunicaciones y carreras digitales'),
  ('salud',      '🩺', 'Salud y ciencias de la vida', 'Medicina, enfermería, nutrición, odontología y áreas de la salud'),
  ('negocios',   '📊', 'Negocios y economía',          'Administración, economía, finanzas, marketing y emprendimiento'),
  ('artes',      '🎨', 'Artes y humanidades',          'Diseño, comunicación, bellas artes, filosofía y humanidades'),
  ('educacion',  '📚', 'Educación y pedagogía',        'Licenciaturas, pedagogía, docencia y ciencias de la educación'),
  ('ambiente',   '🌿', 'Ambiente y sostenibilidad',    'Ingeniería ambiental, biología, ecología y desarrollo sostenible')
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
IF NOT EXISTS (SELECT 1 FROM convocatorias) THEN
INSERT INTO convocatorias (tipo, titulo, institucion, ciudad, detalles, url, fecha_cierre) VALUES
(
  'Beca', 'Jóvenes en Acción — apoyo de sostenimiento', 'Prosperidad Social', 'Nacional',
  '{"requisitos": ["Ser colombiano/a beneficiario/a del programa", "Estar matriculado/a en un programa técnico o tecnológico del SENA o IES pública", "No haber recibido el beneficio anteriormente", "Pertenecer a los estratos 1 o 2", "Mantener rendimiento académico satisfactorio"], "pasos": [{"num": 1, "texto": "Verifica tu inscripción en la base de datos de Prosperidad Social"}, {"num": 2, "texto": "Actualiza tu información en el portal de prosperidadsocial.gov.co"}, {"num": 3, "texto": "Reporta tu matrícula activa en el sistema"}, {"num": 4, "texto": "Recibe el giro bimestral automáticamente"}]}',
  'https://prosperidadsocial.gov.co', NOW() + INTERVAL '3 days'
),
(
  'Beca', 'Beca Saber Pa'' Pilo — matrícula completa', 'ICETEX', 'Nacional',
  '{"requisitos": ["Ser colombiano/a y estar matriculado/a en una IES acreditada", "Tener ICFES (Saber 11) con puntaje mínimo de 310 puntos", "Pertenecer a los estratos 1, 2 o 3", "No tener título de educación superior previo", "Mantener promedio acumulado igual o superior a 3.5"], "pasos": [{"num": 1, "texto": "Regístrate en el portal de ICETEX (icetex.gov.co)"}, {"num": 2, "texto": "Carga los documentos requeridos (ICFES, matrícula, certificado de estrato)"}, {"num": 3, "texto": "Diligencia el formulario de solicitud de beca antes de la fecha límite"}, {"num": 4, "texto": "Espera la notificación de preselección (15 días hábiles)"}, {"num": 5, "texto": "Entrevista virtual con el comité evaluador"}]}',
  'https://www.icetex.gov.co', NOW() + INTERVAL '4 days'
),
(
  'SENA', 'Tecnólogo en Análisis de Datos', 'SENA', 'Bogotá',
  '{"requisitos": ["Ser bachiller (grado 11 aprobado o título)", "Mayor de 16 años al momento de inicio del programa", "No tener contrato laboral activo con empresa del sector"], "pasos": [{"num": 1, "texto": "Consulta la oferta de programas en el portal del SENA (sena.edu.co)"}, {"num": 2, "texto": "Regístrate como aprendiz y crea tu hoja de vida en Sofía Plus"}, {"num": 3, "texto": "Inscríbete al programa en las fechas de apertura"}, {"num": 4, "texto": "Realiza las pruebas de conocimiento si el cupo es limitado"}]}',
  'https://www.sena.edu.co', NOW() + INTERVAL '6 days'
),
(
  'Admisión', 'Inscripciones pregrado 2026-2', 'Universidad Nacional de Colombia', 'Bogotá',
  '{"requisitos": ["Haber presentado el ICFES (Saber 11) en los últimos 5 años", "No tener título de pregrado de la Universidad Nacional", "Estar en los primeros puestos del listado de admitidos"], "pasos": [{"num": 1, "texto": "Ingresa al sistema de inscripción en dniaspiranteunal.unal.edu.co"}, {"num": 2, "texto": "Paga el valor de inscripción ($180.000 aprox.)"}, {"num": 3, "texto": "Presenta el examen de admisión en la fecha programada"}, {"num": 4, "texto": "Consulta resultados 30 días después del examen"}]}',
  'https://www.unal.edu.co', NOW() + INTERVAL '12 days'
),
(
  'Evento', 'Feria de universidades — entrada libre', 'Corferias', 'Bogotá',
  '{"requisitos": ["Entrada libre para bachilleres y universitarios", "Llevar documento de identidad", "Registro previo recomendado para acceso prioritario"], "pasos": [{"num": 1, "texto": "Regístrate en el portal de la feria para acceso prioritario"}, {"num": 2, "texto": "Descarga tu entrada digital o recógela en taquilla"}, {"num": 3, "texto": "Asiste y recorre los stands de más de 80 instituciones"}, {"num": 4, "texto": "Participa en las charlas vocacionales y talleres gratuitos"}]}',
  'https://www.corferias.com', NOW() + INTERVAL '19 days'
);
END IF;
END $$;

INSERT INTO contenido_rutas (area, materias_comunes, temas_previos, proyectos, recursos) VALUES
('administrativo', '["Administración","Contabilidad","Economía","Finanzas","Mercadeo","Gestión Humana","Estadística","Emprendimiento","Planeación Estratégica","Comercio Internacional","Gestión de Operaciones","Gestión de Proyectos"]'::jsonb, '["Matemáticas básicas","Comunicación","Excel","Economía básica","Pensamiento analítico"]'::jsonb, '["Plan de negocio","Presupuesto empresarial","Estudio de mercado","Plan de marketing","Dashboard financiero","Modelo de emprendimiento"]'::jsonb, '[{"url":"https://www.sena.edu.co/","titulo":"SENA"},{"url":"https://www.ccb.org.co/","titulo":"Cámara de Comercio de Bogotá"},{"url":"https://www.banrep.gov.co/","titulo":"Banco de la República"}]'::jsonb),
('ambiental', '["Ecología","Química Ambiental","Biología","Hidrología","Gestión Ambiental","Legislación Ambiental","Cambio Climático","Evaluación de Impacto Ambiental","Manejo de Residuos","Cartografía y SIG","Educación Ambiental","Desarrollo Sostenible"]'::jsonb, '["Biología básica","Química básica","Ecología","Método científico","Actualidad ambiental"]'::jsonb, '["Diagnóstico ambiental de un espacio cercano","Proyecto de reciclaje escolar","Huerta urbana","Campaña de sensibilización ambiental","Monitoreo de un ecosistema local"]'::jsonb, '[{"url":"https://www.minambiente.gov.co/","titulo":"Ministerio de Ambiente y Desarrollo Sostenible"},{"url":"https://www.parquesnacionales.gov.co/","titulo":"Parques Nacionales Naturales de Colombia"},{"url":"https://www.ideam.gov.co/","titulo":"IDEAM"}]'::jsonb),
('arte', '["Dibujo","Historia del Arte","Teoría del Color","Composición","Tipografía","Diseño Gráfico","Ilustración","Fotografía","Diseño UX/UI","Modelado","Animación","Portafolio"]'::jsonb, '["Dibujo básico","Creatividad","Composición visual","Manejo básico de software de diseño"]'::jsonb, '["Identidad visual","Cartel","Ilustración editorial","Prototipo UX/UI","Animación corta","Portafolio profesional"]'::jsonb, '[{"url":"https://helpx.adobe.com/learn.html","titulo":"Adobe Learn"},{"url":"https://help.figma.com/hc/en-us/categories/360002051613-Learn-design","titulo":"Figma Learn"}]'::jsonb),
('ciencias', '["Biología","Química","Física","Matemáticas","Geología","Ecología","Microbiología","Genética","Estadística","Métodos de Investigación","Bioquímica","Ciencias Ambientales"]'::jsonb, '["Álgebra","Biología básica","Química básica","Física básica","Método científico"]'::jsonb, '["Experimento científico","Colección de datos ambientales","Modelo ecológico","Informe de laboratorio","Investigación experimental"]'::jsonb, '[{"url":"https://minciencias.gov.co/","titulo":"Ministerio de Ciencia"},{"url":"https://www.ideam.gov.co/","titulo":"IDEAM"},{"url":"https://bibliotecadigital.minciencias.gov.co/","titulo":"Biblioteca Virtual de Ciencia"}]'::jsonb),
('comunicacion', '["Teoría de la Comunicación","Redacción","Periodismo","Comunicación Digital","Producción Audiovisual","Fotografía","Diseño Editorial","Narrativa","Comunicación Organizacional","Publicidad","Investigación de Medios","Ética de la Comunicación"]'::jsonb, '["Lectura","Escritura","Creatividad","Herramientas digitales","Cultura general"]'::jsonb, '["Podcast","Blog periodístico","Campaña digital","Documental corto","Revista digital","Plan de comunicación"]'::jsonb, '[{"url":"https://www.rtvc.gov.co/","titulo":"RTVC"},{"url":"https://www.mintic.gov.co/","titulo":"MinTIC"},{"url":"https://grow.google/intl/es/courses-and-tools/","titulo":"Google Digital Garage"}]'::jsonb),
('deporte', '["Anatomía","Fisiología del Ejercicio","Biomecánica","Entrenamiento Deportivo","Pedagogía del Deporte","Nutrición Deportiva","Psicología del Deporte","Recreación y Tiempo Libre","Primeros Auxilios","Lesiones Deportivas","Evaluación Física","Gestión Deportiva"]'::jsonb, '["Biología básica","Anatomía básica","Hábitos de actividad física","Nutrición básica","Trabajo en equipo"]'::jsonb, '["Rutina de entrenamiento propia","Plan de actividad física para un grupo","Campaña de hábitos saludables","Organización de un torneo escolar","Diario de rendimiento deportivo"]'::jsonb, '[{"url":"https://www.mindeporte.gov.co/","titulo":"Ministerio del Deporte"},{"url":"https://www.sena.edu.co/","titulo":"SENA"}]'::jsonb),
('diseño', '["Dibujo","Historia del Arte","Teoría del Color","Composición","Tipografía","Diseño Gráfico","Ilustración","Fotografía","Diseño UX/UI","Modelado","Animación","Portafolio"]'::jsonb, '["Dibujo básico","Creatividad","Composición visual","Manejo básico de software de diseño"]'::jsonb, '["Identidad visual","Cartel","Ilustración editorial","Prototipo UX/UI","Animación corta","Portafolio profesional"]'::jsonb, '[{"url":"https://helpx.adobe.com/learn.html","titulo":"Adobe Learn"},{"url":"https://help.figma.com/hc/en-us/categories/360002051613-Learn-design","titulo":"Figma Learn"}]'::jsonb),
('educacion', '["Pedagogía","Didáctica","Psicología del Desarrollo","Evaluación Educativa","Currículo","Investigación Educativa","Inclusión Educativa","Tecnologías Educativas","Gestión Educativa","Filosofía de la Educación","Práctica Pedagógica","Comunicación Educativa"]'::jsonb, '["Lectura crítica","Comunicación","Psicología básica","Investigación","Manejo de herramientas digitales"]'::jsonb, '["Secuencia didáctica","Clase interactiva","Material educativo digital","Proyecto de inclusión","Instrumento de evaluación","Investigación educativa"]'::jsonb, '[{"url":"https://www.mineducacion.gov.co/","titulo":"Ministerio de Educación Nacional"},{"url":"https://www.colombiaaprende.edu.co/","titulo":"Colombia Aprende"}]'::jsonb),
('humanidades', '["Filosofía","Historia","Literatura","Ética","Lógica","Epistemología","Antropología Filosófica","Estética","Lenguaje y Comunicación","Historia del Pensamiento","Metodología de la Investigación","Cultura y Sociedad"]'::jsonb, '["Lectura crítica","Escritura académica","Historia general","Pensamiento crítico","Cultura general"]'::jsonb, '["Ensayo filosófico","Club de lectura","Línea de tiempo histórica","Debate argumentativo","Investigación sobre un movimiento cultural"]'::jsonb, '[{"url":"https://www.bibliotecanacional.gov.co/","titulo":"Biblioteca Nacional de Colombia"},{"url":"https://www.mincultura.gov.co/","titulo":"Ministerio de Cultura"}]'::jsonb),
('juridico', '["Introducción al Derecho","Derecho Constitucional","Derecho Civil","Derecho Penal","Derecho Laboral","Derecho Comercial","Derecho Administrativo","Derecho Procesal","Derecho Internacional","Derechos Humanos","Teoría del Estado","Argumentación Jurídica"]'::jsonb, '["Lectura crítica","Redacción","Argumentación","Historia","Constitución Política de Colombia"]'::jsonb, '["Análisis de una sentencia","Simulación de audiencia","Concepto jurídico","Análisis de contrato","Investigación sobre derechos fundamentales"]'::jsonb, '[{"url":"https://www.secretariasenado.gov.co/","titulo":"Secretaría del Senado"},{"url":"https://www.corteconstitucional.gov.co/","titulo":"Corte Constitucional"},{"url":"https://www.minjusticia.gov.co/","titulo":"Ministerio de Justicia"}]'::jsonb),
('negocios', '["Administración","Contabilidad","Economía","Finanzas","Mercadeo","Gestión Humana","Estadística","Emprendimiento","Planeación Estratégica","Comercio Internacional","Gestión de Operaciones","Gestión de Proyectos"]'::jsonb, '["Matemáticas básicas","Comunicación","Excel","Economía básica","Pensamiento analítico"]'::jsonb, '["Plan de negocio","Presupuesto empresarial","Estudio de mercado","Plan de marketing","Dashboard financiero","Modelo de emprendimiento"]'::jsonb, '[{"url":"https://www.sena.edu.co/","titulo":"SENA"},{"url":"https://www.ccb.org.co/","titulo":"Cámara de Comercio de Bogotá"},{"url":"https://www.banrep.gov.co/","titulo":"Banco de la República"}]'::jsonb),
('salud', '["Anatomía","Fisiología","Bioquímica","Microbiología","Farmacología","Patología","Epidemiología","Genética","Nutrición","Salud Pública","Bioética","Primeros Auxilios"]'::jsonb, '["Biología","Química","Anatomía básica","Método científico","Lectura crítica"]'::jsonb, '["Mapa del cuerpo humano","Campaña de prevención","Infografía de hábitos saludables","Base de datos epidemiológica","Proyecto de promoción de la salud"]'::jsonb, '[{"url":"https://www.minsalud.gov.co/","titulo":"Ministerio de Salud y Protección Social"},{"url":"https://www.who.int/","titulo":"Organización Mundial de la Salud"}]'::jsonb),
('social', '["Sociología","Antropología","Historia","Geografía","Ciencia Política","Metodología de Investigación","Estadística Social","Relaciones Internacionales","Derechos Humanos","Teoría Social","Políticas Públicas","Economía Social"]'::jsonb, '["Historia","Lectura crítica","Escritura","Geografía","Investigación básica"]'::jsonb, '["Investigación social","Encuesta comunitaria","Mapa social","Análisis de política pública","Historia local","Proyecto de intervención comunitaria"]'::jsonb, '[{"url":"https://www.dane.gov.co/","titulo":"DANE"},{"url":"https://www.banrep.gov.co/","titulo":"Banco de la República"},{"url":"https://www.mineducacion.gov.co/","titulo":"Ministerio de Educación Nacional"}]'::jsonb),
('tecnologia', '["Programación I","Programación II","Estructuras de Datos","Bases de Datos","Redes","Ingeniería de Software","Sistemas Operativos","Arquitectura de Software","Desarrollo Web","Seguridad Informática","Inteligencia Artificial","Computación en la Nube"]'::jsonb, '["Lógica de programación","Algoritmos","Matemáticas básicas","Python o JavaScript","Git y GitHub"]'::jsonb, '["Calculadora","To-do list","API REST","Aplicación web CRUD","Sistema de inventario","Chat en tiempo real","Proyecto con inteligencia artificial"]'::jsonb, '[{"url":"https://oferta.senasofiaplus.edu.co/sofia-oferta/","titulo":"SENA Sofia Plus"},{"url":"https://www.freecodecamp.org/","titulo":"freeCodeCamp"},{"url":"https://developer.mozilla.org/","titulo":"MDN Web Docs"},{"url":"https://skills.github.com/","titulo":"GitHub Skills"}]'::jsonb)
ON CONFLICT (area) DO UPDATE SET
  materias_comunes = EXCLUDED.materias_comunes,
  temas_previos     = EXCLUDED.temas_previos,
  proyectos         = EXCLUDED.proyectos,
  recursos          = EXCLUDED.recursos;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Deberías ver 22 tablas (más las huérfanas si venís de una base vieja:
-- perfiles / roles / programa_categorias / perfiles_vocacionales — ver
-- docs/modelo_datos.md, no se crean acá porque nada del código vivo las usa)