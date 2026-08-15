-- ============================================================
-- MIGRACIÓN RUTAS FORMATIVAS — Brota
-- Ejecutar en el SQL Editor de Supabase (o vía psql)
-- ============================================================
-- Contenido estático por área académica (mismas 14 claves que ya usan
-- Profesiones.jsx / TestResult.jsx / vocacionalCategorias.js). Nada de
-- scraping de pensums ni llamadas en vivo a una API de LLM: el contenido
-- se escribió una sola vez (agosto 2026) y se sirve tal cual, para no
-- generar costo ni dependencia externa en /dashboard/rutas.

CREATE TABLE IF NOT EXISTS contenido_rutas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area          TEXT UNIQUE NOT NULL,
  temas_previos JSONB NOT NULL DEFAULT '[]',
  proyectos     JSONB NOT NULL DEFAULT '[]',
  recursos      JSONB NOT NULL DEFAULT '[]', -- [{ "titulo": "...", "url": "..." }] — links de búsqueda de YouTube, no videos puntuales (evita links rotos)
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO contenido_rutas (area, temas_previos, proyectos, recursos) VALUES
('tecnologia',
  '["Lógica de programación", "Un lenguaje base (Python o JavaScript)", "Matemáticas discretas", "Uso de la terminal y Git", "Inglés técnico"]',
  '["Una calculadora simple", "Un to-do list", "Una página web personal"]',
  '[{"titulo":"Curso de programación para principiantes","url":"https://www.youtube.com/results?search_query=curso+de+programacion+para+principiantes+en+espa%C3%B1ol"},{"titulo":"Lógica de programación desde cero","url":"https://www.youtube.com/results?search_query=logica+de+programacion+desde+cero"}]'
),
('salud',
  '["Biología celular", "Química básica", "Anatomía general", "Primeros auxilios", "Ética en salud"]',
  '["Voluntariado en brigadas de salud", "Sacar una certificación básica de primeros auxilios"]',
  '[{"titulo":"Biología celular explicada","url":"https://www.youtube.com/results?search_query=biologia+celular+explicada"},{"titulo":"Anatomía humana básica","url":"https://www.youtube.com/results?search_query=anatomia+humana+basica"}]'
),
('ciencias',
  '["El método científico", "Física básica", "Estadística", "Redacción de informes", "Pensamiento crítico"]',
  '["Documentar un experimento casero", "Participar en una feria de ciencias"]',
  '[{"titulo":"El método científico explicado","url":"https://www.youtube.com/results?search_query=metodo+cientifico+explicado"},{"titulo":"Estadística básica para principiantes","url":"https://www.youtube.com/results?search_query=estadistica+basica+para+principiantes"}]'
),
('diseño',
  '["Teoría del color", "Tipografía", "Composición visual", "Herramientas como Figma o Canva", "Historia del diseño"]',
  '["Rediseñar el logo de una marca ficticia", "Crear una identidad visual simple"]',
  '[{"titulo":"Fundamentos de diseño gráfico","url":"https://www.youtube.com/results?search_query=fundamentos+de+diseno+grafico"},{"titulo":"Teoría del color para diseñadores","url":"https://www.youtube.com/results?search_query=teoria+del+color+para+disenadores"}]'
),
('arte',
  '["Historia del arte", "Dibujo básico", "Composición", "Técnicas de tu disciplina (pintura, escultura, etc.)"]',
  '["Armar un portafolio de 5 piezas", "Participar en una exposición estudiantil"]',
  '[{"titulo":"Fundamentos de dibujo para principiantes","url":"https://www.youtube.com/results?search_query=fundamentos+de+dibujo+para+principiantes"},{"titulo":"Historia del arte resumen","url":"https://www.youtube.com/results?search_query=historia+del+arte+resumen"}]'
),
('educacion',
  '["Psicología del aprendizaje", "Didáctica general", "Comunicación oral", "Diseño curricular básico"]',
  '["Dar una clase de prueba a compañeros", "Hacer tutorías voluntarias"]',
  '[{"titulo":"Psicología del aprendizaje explicada","url":"https://www.youtube.com/results?search_query=psicologia+del+aprendizaje+explicada"},{"titulo":"Cómo dar una buena clase","url":"https://www.youtube.com/results?search_query=como+dar+una+buena+clase"}]'
),
('social',
  '["Teoría social básica", "Historia de Colombia", "Métodos de investigación cualitativa", "Redacción académica"]',
  '["Una pequeña investigación sobre tu comunidad", "Voluntariado social"]',
  '[{"titulo":"Introducción a las ciencias sociales","url":"https://www.youtube.com/results?search_query=introduccion+a+las+ciencias+sociales"},{"titulo":"Métodos de investigación cualitativa","url":"https://www.youtube.com/results?search_query=metodos+de+investigacion+cualitativa"}]'
),
('comunicacion',
  '["Redacción periodística", "Oratoria", "Edición básica de video o audio", "Ética en medios"]',
  '["Un podcast corto", "Un blog personal", "Cubrir un evento del colegio"]',
  '[{"titulo":"Cómo escribir una noticia","url":"https://www.youtube.com/results?search_query=como+escribir+una+noticia"},{"titulo":"Oratoria y hablar en público","url":"https://www.youtube.com/results?search_query=oratoria+y+hablar+en+publico"}]'
),
('juridico',
  '["Constitución Política de Colombia", "Argumentación", "Redacción de textos formales", "Ética"]',
  '["Un debate estudiantil", "Un simulacro de juicio (moot court)"]',
  '[{"titulo":"Introducción al derecho en Colombia","url":"https://www.youtube.com/results?search_query=introduccion+al+derecho+en+colombia"},{"titulo":"Cómo argumentar un caso","url":"https://www.youtube.com/results?search_query=como+argumentar+un+caso+juridico"}]'
),
('negocios',
  '["Matemática financiera básica", "Excel u hojas de cálculo", "Fundamentos de marketing", "Emprendimiento"]',
  '["Un plan de negocio simple", "Vender algo pequeño (real o simulado)"]',
  '[{"titulo":"Fundamentos de finanzas personales","url":"https://www.youtube.com/results?search_query=fundamentos+de+finanzas+personales"},{"titulo":"Cómo hacer un plan de negocio","url":"https://www.youtube.com/results?search_query=como+hacer+un+plan+de+negocio"}]'
),
('administrativo',
  '["Gestión de proyectos", "Excel", "Comunicación organizacional", "Contabilidad básica"]',
  '["Organizar un evento estudiantil", "Simular la administración de un pequeño negocio"]',
  '[{"titulo":"Gestión de proyectos para principiantes","url":"https://www.youtube.com/results?search_query=gestion+de+proyectos+para+principiantes"},{"titulo":"Contabilidad básica explicada","url":"https://www.youtube.com/results?search_query=contabilidad+basica+explicada"}]'
),
('humanidades',
  '["Filosofía básica", "Historia universal", "Lectura crítica", "Redacción de ensayos"]',
  '["Escribir un ensayo", "Participar en un club de lectura"]',
  '[{"titulo":"Introducción a la filosofía","url":"https://www.youtube.com/results?search_query=introduccion+a+la+filosofia"},{"titulo":"Cómo escribir un ensayo argumentativo","url":"https://www.youtube.com/results?search_query=como+escribir+un+ensayo+argumentativo"}]'
),
('ambiental',
  '["Ecología básica", "Cambio climático", "Química ambiental", "Normativa ambiental colombiana"]',
  '["Un proyecto de reciclaje en tu colegio", "Documentar un ecosistema cercano"]',
  '[{"titulo":"Ecología básica explicada","url":"https://www.youtube.com/results?search_query=ecologia+basica+explicada"},{"titulo":"Cambio climático causas y consecuencias","url":"https://www.youtube.com/results?search_query=cambio+climatico+causas+y+consecuencias"}]'
),
('deporte',
  '["Anatomía y fisiología básica", "Nutrición deportiva", "Principios de entrenamiento"]',
  '["Diseñar una rutina de entrenamiento propia", "Ayudar a entrenar un equipo escolar"]',
  '[{"titulo":"Fisiología del ejercicio básica","url":"https://www.youtube.com/results?search_query=fisiologia+del+ejercicio+basica"},{"titulo":"Principios de entrenamiento deportivo","url":"https://www.youtube.com/results?search_query=principios+de+entrenamiento+deportivo"}]'
)
ON CONFLICT (area) DO NOTHING;
