-- Datos exclusivamente sintéticos para el entorno local de Brota.
-- Nunca copiar registros desde backups/ a este archivo.

INSERT INTO public.roles (id, nombre) VALUES
  ('10000000-0000-4000-8000-000000000001', 'estudiante'),
  ('10000000-0000-4000-8000-000000000002', 'moderador'),
  ('10000000-0000-4000-8000-000000000003', 'admin'),
  ('10000000-0000-4000-8000-000000000004', 'institucion');

INSERT INTO public.perfiles_vocacionales (id, categoria, emoji, titulo, descripcion, color) VALUES
  ('20000000-0000-4000-8000-000000000001', 'tecnologia', '💻', 'Tecnología', 'Interés por crear soluciones digitales.', 'blue'),
  ('20000000-0000-4000-8000-000000000002', 'salud', '🩺', 'Salud', 'Interés por el bienestar de las personas.', 'emerald'),
  ('20000000-0000-4000-8000-000000000003', 'arte', '🎨', 'Arte', 'Interés por la expresión y la creatividad.', 'purple');

INSERT INTO public.instituciones (id, nombre, tipo, ciudad, departamento, activa) VALUES
  ('30000000-0000-4000-8000-000000000001', 'Instituto Demo Bogotá', 'Universidad', 'Bogotá', 'Bogotá D.C.', true),
  ('30000000-0000-4000-8000-000000000002', 'Centro Técnico Demo', 'Institución técnica', 'Medellín', 'Antioquia', true);

INSERT INTO public.programas
  (id, institucion_id, nombre, tipo, area_academica, duracion, modalidad, descripcion, costo_matricula, categoria, activo)
VALUES
  ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'Ingeniería de Software', 'Pregrado', 'Tecnología', '10 semestres', 'Presencial', 'Programa ficticio para probar recomendaciones.', 0, 'tecnologia', true),
  ('40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', 'Auxiliar de Enfermería', 'Técnico', 'Salud', '3 semestres', 'Presencial', 'Programa ficticio para probar recomendaciones.', 0, 'salud', true);

INSERT INTO public.foros (id, icon, nombre, descripcion) VALUES
  ('general', '💬', 'Comunidad general', 'Conversaciones entre estudiantes.'),
  ('orientacion', '🧭', 'Orientación vocacional', 'Preguntas sobre carreras y decisiones académicas.');

INSERT INTO public.contenido_rutas (id, area, materias_comunes, temas_previos, proyectos, recursos) VALUES
  ('50000000-0000-4000-8000-000000000001', 'Tecnología', '["Matemáticas", "Inglés"]', '["Algoritmos"]', '["Página web personal"]', '["Documentación oficial"]'),
  ('50000000-0000-4000-8000-000000000002', 'Salud', '["Biología", "Química"]', '["Anatomía básica"]', '["Campaña de prevención"]', '["Guías de salud pública"]');

INSERT INTO public.convocatorias (id, tipo, titulo, institucion, ciudad, descripcion, fecha_cierre, activa) VALUES
  ('60000000-0000-4000-8000-000000000001', 'Beca', 'Beca Demo de Orientación', 'Fundación Demo', 'Nacional', 'Convocatoria sintética para desarrollo local.', CURRENT_DATE + INTERVAL '90 days', true);
