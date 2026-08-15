-- migration_contadores_atomicos.sql
-- Funciones RPC para incrementar/decrementar de forma atómica los contadores
-- de votos (posts_foro) y likes (historias).
--
-- Por qué: el código anterior hacía SELECT votos -> calcular en JS -> UPDATE,
-- lo que bajo dos requests concurrentes puede perder una actualización
-- (ambas leen el mismo valor y escriben el mismo resultado). Un solo UPDATE
-- con la aritmética adentro es atómico a nivel de fila en Postgres.
--
-- Ejecutar en el SQL Editor de Supabase.

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
