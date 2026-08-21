-- ============================================================
-- RLS FALTANTE — comunidad, reportes y rutas
-- Ejecutar en el SQL Editor de Supabase (o vía psql)
-- ============================================================
-- migration_comunidad.sql, migration_reportes_preguntas.sql y
-- migration_rutas.sql crearon estas 10 tablas sin habilitar RLS
-- (a diferencia de migration_contactos.sql, que sí lo tenía desde el
-- inicio). Detectado por el linter de seguridad de Supabase, agosto
-- 2026. Todo el acceso real pasa por el backend con SUPABASE_SERVICE_KEY
-- (bypassea RLS siempre) — el frontend nunca hace .from() directo,
-- solo supabase.auth.* (verificado). Mismo patrón que contactos: RLS
-- habilitado + policy explícita de solo lectura/escritura para
-- service_role, todo lo demás queda bloqueado por defecto.

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'foros', 'posts_foro', 'votos_post', 'respuestas_post',
    'historias', 'likes_historia', 'preguntas_comunidad', 'respuestas_pregunta',
    'reportes_pregunta', 'contenido_rutas'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "solo_service_role" ON %I', t);
    EXECUTE format(
      'CREATE POLICY "solo_service_role" ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      t
    );
  END LOOP;
END $$;
