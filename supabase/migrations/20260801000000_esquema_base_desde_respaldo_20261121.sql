-- Baseline de esquema public verificado contra el respaldo de 2026-11-21.
-- No contiene datos ni credenciales; no editar manualmente sin una migración posterior.




SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."es_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM perfiles
    WHERE id = auth.uid() AND rol = 'admin'
  );
$$;


ALTER FUNCTION "public"."es_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.perfiles (id, email, nombre, apellido)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'nombre',
    new.raw_user_meta_data->>'apellido'
  );
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  return exists (
    select 1 from perfiles
    where id = auth.uid() and rol = 'admin'
  );
end;
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_tablero_brota_task_audit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_tablero_brota_task_audit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."contactos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" "text" NOT NULL,
    "email" "text" NOT NULL,
    "telefono" "text",
    "asunto" "text" NOT NULL,
    "mensaje" "text" NOT NULL,
    "estado" "text" DEFAULT 'pendiente'::"text",
    "notas_admin" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "contactos_estado_check" CHECK (("estado" = ANY (ARRAY['pendiente'::"text", 'leido'::"text", 'respondido'::"text", 'archivado'::"text"])))
);


ALTER TABLE "public"."contactos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contenido_rutas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "area" "text" NOT NULL,
    "temas_previos" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "proyectos" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "recursos" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "materias_comunes" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL
);


ALTER TABLE "public"."contenido_rutas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."convocatorias" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tipo" "text" NOT NULL,
    "titulo" "text" NOT NULL,
    "institucion" "text" NOT NULL,
    "ciudad" "text" DEFAULT 'Nacional'::"text" NOT NULL,
    "descripcion" "text",
    "detalles" "jsonb" DEFAULT '{}'::"jsonb",
    "url" "text",
    "fecha_cierre" timestamp with time zone,
    "activa" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."convocatorias" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cuestionarios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" character varying(200) NOT NULL,
    "version" character varying(50) NOT NULL,
    "descripcion" "text",
    "activo" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "institucion_id" "uuid"
);


ALTER TABLE "public"."cuestionarios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."foros" (
    "id" "text" NOT NULL,
    "icon" "text" NOT NULL,
    "nombre" "text" NOT NULL,
    "descripcion" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."foros" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."historias" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "titulo" "text" NOT NULL,
    "contenido" "text" NOT NULL,
    "area" "text" NOT NULL,
    "carrera" "text",
    "institucion" "text",
    "anonimo" boolean DEFAULT true,
    "autor_nombre" "text",
    "publicada" boolean DEFAULT false,
    "likes" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "oculta" boolean DEFAULT false
);


ALTER TABLE "public"."historias" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."instituciones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" character varying(200) NOT NULL,
    "tipo" character varying(100),
    "ciudad" character varying(100),
    "departamento" character varying(100),
    "direccion" "text",
    "telefono" character varying(50),
    "email" character varying(100),
    "sitio_web" "text",
    "costo_promedio" integer,
    "activa" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."instituciones" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."likes_historia" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "historia_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."likes_historia" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."men_sincronizacion" (
    "id" integer NOT NULL,
    "ejecutada_en" timestamp with time zone DEFAULT "now"() NOT NULL,
    "remote_timestamp" bigint,
    "programas_importados" integer DEFAULT 0 NOT NULL,
    "instituciones_importadas" integer DEFAULT 0 NOT NULL,
    "estado" "text" DEFAULT 'exitosa'::"text" NOT NULL,
    "error" "text"
);


ALTER TABLE "public"."men_sincronizacion" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."men_sincronizacion_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."men_sincronizacion_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."men_sincronizacion_id_seq" OWNED BY "public"."men_sincronizacion"."id";



CREATE TABLE IF NOT EXISTS "public"."opciones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pregunta_id" "uuid",
    "label" "text" NOT NULL,
    "icon" "text",
    "orden" integer DEFAULT 0 NOT NULL,
    "es_correcta" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."opciones" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."perfiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "nombre" "text",
    "apellido" "text",
    "rol" "text" DEFAULT 'usuario'::"text",
    "activo" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."perfiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."perfiles_usuario" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "nombre" character varying(100) NOT NULL,
    "apellido" character varying(100) NOT NULL,
    "edad" integer,
    "ciudad" character varying(100),
    "nivel_educativo" character varying(100),
    "condiciones_socioeconomicas" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "rol" "text" DEFAULT 'estudiante'::"text" NOT NULL,
    "baneado_preguntas_hasta" timestamp with time zone,
    "ultima_actividad" "date",
    "racha_dias" integer DEFAULT 0,
    "broti_config" "jsonb" DEFAULT '{}'::"jsonb",
    "grado" character varying(50),
    "telefono" character varying(50),
    "bloqueado_hasta" timestamp with time zone,
    "permisos_override" "jsonb" DEFAULT '{}'::"jsonb",
    "institucion_id" "uuid",
    "institucion_contacto" "text",
    "institucion_descripcion" "text",
    CONSTRAINT "perfiles_usuario_edad_check" CHECK ((("edad" >= 14) AND ("edad" <= 100)))
);


ALTER TABLE "public"."perfiles_usuario" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."perfiles_vocacionales" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "categoria" "text" NOT NULL,
    "emoji" "text" NOT NULL,
    "titulo" "text" NOT NULL,
    "descripcion" "text" NOT NULL,
    "color" "text" DEFAULT 'emerald'::"text" NOT NULL,
    CONSTRAINT "perfiles_vocacionales_color_check" CHECK (("color" = ANY (ARRAY['amber'::"text", 'emerald'::"text", 'blue'::"text", 'purple'::"text", 'rose'::"text", 'teal'::"text"])))
);


ALTER TABLE "public"."perfiles_vocacionales" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pesos_opciones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "opcion_id" "uuid",
    "categoria" "text" NOT NULL,
    "puntos" integer DEFAULT 1 NOT NULL,
    CONSTRAINT "pesos_opciones_puntos_check" CHECK (("puntos" > 0))
);


ALTER TABLE "public"."pesos_opciones" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."posts_foro" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "foro_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "titulo" "text" NOT NULL,
    "contenido" "text" NOT NULL,
    "anonimo" boolean DEFAULT false,
    "autor_nombre" "text",
    "votos" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "oculta" boolean DEFAULT false
);


ALTER TABLE "public"."posts_foro" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."preguntas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cuestionario_id" "uuid",
    "texto" "text" NOT NULL,
    "tipo" character varying(50) NOT NULL,
    "orden" integer NOT NULL,
    "categoria" character varying(100),
    "peso" numeric(3,2) DEFAULT 1.0,
    "opciones" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."preguntas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."preguntas_comunidad" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "titulo" "text" NOT NULL,
    "area" "text" DEFAULT 'General'::"text" NOT NULL,
    "anonimo" boolean DEFAULT false,
    "autor_nombre" "text",
    "resuelta" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "oculta" boolean DEFAULT false
);


ALTER TABLE "public"."preguntas_comunidad" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."programa_categorias" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "programa_id" "uuid",
    "categoria" character varying(50) NOT NULL,
    "peso" integer DEFAULT 100
);


ALTER TABLE "public"."programa_categorias" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."programas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "institucion_id" "uuid",
    "nombre" character varying(200) NOT NULL,
    "tipo" character varying(100),
    "area_academica" character varying(100),
    "duracion" character varying(100),
    "modalidad" character varying(50),
    "descripcion" "text",
    "requisitos" "text",
    "costo_matricula" integer,
    "perfil_compatible" "jsonb" DEFAULT '{}'::"jsonb",
    "activo" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "categoria" "text"
);


ALTER TABLE "public"."programas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recomendaciones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "programa_id" "uuid",
    "resultado_id" "uuid",
    "compatibilidad" numeric(5,2),
    "razones" "text",
    "vista" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "recomendaciones_compatibilidad_check" CHECK ((("compatibilidad" >= (0)::numeric) AND ("compatibilidad" <= (100)::numeric)))
);


ALTER TABLE "public"."recomendaciones" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reportes_pregunta" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pregunta_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "motivo" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reportes_pregunta" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."respuestas_post" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "contenido" "text" NOT NULL,
    "anonimo" boolean DEFAULT false,
    "autor_nombre" "text",
    "votos" integer DEFAULT 0,
    "es_mejor_respuesta" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."respuestas_post" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."respuestas_pregunta" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pregunta_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "contenido" "text" NOT NULL,
    "anonimo" boolean DEFAULT false,
    "autor_nombre" "text",
    "votos" integer DEFAULT 0,
    "es_mejor" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."respuestas_pregunta" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resultados" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "perfil_usuario_id" "uuid",
    "cuestionario_id" "uuid",
    "respuestas" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "perfil_vocacional" "jsonb" DEFAULT '{}'::"jsonb",
    "fecha_realizacion" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."resultados" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" character varying(50) NOT NULL
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tablero_brota_miembros" (
    "user_id" "uuid" NOT NULL,
    "added_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tablero_brota_miembros" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tablero_brota_tareas" (
    "id" "text" NOT NULL,
    "responsable" "text" NOT NULL,
    "capa" "text" NOT NULL,
    "titulo" "text" NOT NULL,
    "estado" "text" DEFAULT 'Por hacer'::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid",
    CONSTRAINT "tablero_brota_tareas_estado_check" CHECK (("estado" = ANY (ARRAY['Por hacer'::"text", 'En progreso'::"text", 'Bloqueada'::"text", 'Hecha'::"text"]))),
    CONSTRAINT "tablero_brota_tareas_id_check" CHECK (("id" = ANY (ARRAY['E1'::"text", 'E2'::"text", 'E3'::"text", 'E4'::"text", 'J1'::"text", 'J2'::"text", 'J3'::"text", 'J4'::"text", 'B1'::"text", 'B2'::"text", 'B3'::"text", 'B4'::"text", 'D1'::"text", 'D2'::"text", 'D3'::"text", 'D4'::"text"])))
);


ALTER TABLE "public"."tablero_brota_tareas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."votos_post" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "direccion" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "votos_post_direccion_check" CHECK (("direccion" = ANY (ARRAY['up'::"text", 'down'::"text"])))
);


ALTER TABLE "public"."votos_post" OWNER TO "postgres";


ALTER TABLE ONLY "public"."men_sincronizacion" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."men_sincronizacion_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."contactos"
    ADD CONSTRAINT "contactos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contenido_rutas"
    ADD CONSTRAINT "contenido_rutas_area_key" UNIQUE ("area");



ALTER TABLE ONLY "public"."contenido_rutas"
    ADD CONSTRAINT "contenido_rutas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."convocatorias"
    ADD CONSTRAINT "convocatorias_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cuestionarios"
    ADD CONSTRAINT "cuestionarios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."foros"
    ADD CONSTRAINT "foros_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."historias"
    ADD CONSTRAINT "historias_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."instituciones"
    ADD CONSTRAINT "instituciones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."likes_historia"
    ADD CONSTRAINT "likes_historia_historia_id_user_id_key" UNIQUE ("historia_id", "user_id");



ALTER TABLE ONLY "public"."likes_historia"
    ADD CONSTRAINT "likes_historia_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."men_sincronizacion"
    ADD CONSTRAINT "men_sincronizacion_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."opciones"
    ADD CONSTRAINT "opciones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."perfiles"
    ADD CONSTRAINT "perfiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."perfiles_usuario"
    ADD CONSTRAINT "perfiles_usuario_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."perfiles_usuario"
    ADD CONSTRAINT "perfiles_usuario_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."perfiles_vocacionales"
    ADD CONSTRAINT "perfiles_vocacionales_categoria_key" UNIQUE ("categoria");



ALTER TABLE ONLY "public"."perfiles_vocacionales"
    ADD CONSTRAINT "perfiles_vocacionales_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pesos_opciones"
    ADD CONSTRAINT "pesos_opciones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."posts_foro"
    ADD CONSTRAINT "posts_foro_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."preguntas_comunidad"
    ADD CONSTRAINT "preguntas_comunidad_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."preguntas"
    ADD CONSTRAINT "preguntas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."programa_categorias"
    ADD CONSTRAINT "programa_categorias_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."programas"
    ADD CONSTRAINT "programas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recomendaciones"
    ADD CONSTRAINT "recomendaciones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reportes_pregunta"
    ADD CONSTRAINT "reportes_pregunta_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reportes_pregunta"
    ADD CONSTRAINT "reportes_pregunta_pregunta_id_user_id_key" UNIQUE ("pregunta_id", "user_id");



ALTER TABLE ONLY "public"."respuestas_post"
    ADD CONSTRAINT "respuestas_post_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."respuestas_pregunta"
    ADD CONSTRAINT "respuestas_pregunta_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resultados"
    ADD CONSTRAINT "resultados_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_nombre_key" UNIQUE ("nombre");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tablero_brota_miembros"
    ADD CONSTRAINT "tablero_brota_miembros_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."tablero_brota_tareas"
    ADD CONSTRAINT "tablero_brota_tareas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votos_post"
    ADD CONSTRAINT "votos_post_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votos_post"
    ADD CONSTRAINT "votos_post_post_id_user_id_key" UNIQUE ("post_id", "user_id");



CREATE INDEX "contactos_created_at_idx" ON "public"."contactos" USING "btree" ("created_at" DESC);



CREATE INDEX "contactos_estado_idx" ON "public"."contactos" USING "btree" ("estado");



CREATE INDEX "idx_convocatorias_activa" ON "public"."convocatorias" USING "btree" ("activa", "fecha_cierre");



CREATE INDEX "idx_historias_publicada" ON "public"."historias" USING "btree" ("publicada", "created_at" DESC);



CREATE INDEX "idx_likes_historia_id" ON "public"."likes_historia" USING "btree" ("historia_id");



CREATE INDEX "idx_opciones_pregunta" ON "public"."opciones" USING "btree" ("pregunta_id");



CREATE INDEX "idx_perfiles_user_id" ON "public"."perfiles_usuario" USING "btree" ("user_id");



CREATE INDEX "idx_pesos_opcion" ON "public"."pesos_opciones" USING "btree" ("opcion_id");



CREATE INDEX "idx_posts_foro_created_at" ON "public"."posts_foro" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_posts_foro_foro_id" ON "public"."posts_foro" USING "btree" ("foro_id");



CREATE INDEX "idx_preguntas_created_at" ON "public"."preguntas_comunidad" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_preguntas_cuestionario" ON "public"."preguntas" USING "btree" ("cuestionario_id");



CREATE INDEX "idx_programas_categoria" ON "public"."programas" USING "btree" ("categoria");



CREATE INDEX "idx_programas_institucion" ON "public"."programas" USING "btree" ("institucion_id");



CREATE INDEX "idx_recomendaciones_resultado" ON "public"."recomendaciones" USING "btree" ("resultado_id");



CREATE INDEX "idx_reportes_pregunta_id" ON "public"."reportes_pregunta" USING "btree" ("pregunta_id");



CREATE INDEX "idx_resp_pregunta_id" ON "public"."respuestas_pregunta" USING "btree" ("pregunta_id");



CREATE INDEX "idx_respuestas_post_id" ON "public"."respuestas_post" USING "btree" ("post_id");



CREATE INDEX "idx_resultados_perfil" ON "public"."resultados" USING "btree" ("perfil_usuario_id");



CREATE INDEX "idx_votos_post_post_id" ON "public"."votos_post" USING "btree" ("post_id");



CREATE OR REPLACE TRIGGER "tablero_brota_task_audit" BEFORE UPDATE ON "public"."tablero_brota_tareas" FOR EACH ROW EXECUTE FUNCTION "public"."set_tablero_brota_task_audit"();



CREATE OR REPLACE TRIGGER "update_cuestionarios_updated_at" BEFORE UPDATE ON "public"."cuestionarios" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_instituciones_updated_at" BEFORE UPDATE ON "public"."instituciones" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_perfiles_usuario_updated_at" BEFORE UPDATE ON "public"."perfiles_usuario" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_programas_updated_at" BEFORE UPDATE ON "public"."programas" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."cuestionarios"
    ADD CONSTRAINT "cuestionarios_institucion_id_fkey" FOREIGN KEY ("institucion_id") REFERENCES "public"."instituciones"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."historias"
    ADD CONSTRAINT "historias_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."likes_historia"
    ADD CONSTRAINT "likes_historia_historia_id_fkey" FOREIGN KEY ("historia_id") REFERENCES "public"."historias"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."likes_historia"
    ADD CONSTRAINT "likes_historia_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."opciones"
    ADD CONSTRAINT "opciones_pregunta_id_fkey" FOREIGN KEY ("pregunta_id") REFERENCES "public"."preguntas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."perfiles"
    ADD CONSTRAINT "perfiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."perfiles_usuario"
    ADD CONSTRAINT "perfiles_usuario_institucion_id_fkey" FOREIGN KEY ("institucion_id") REFERENCES "public"."instituciones"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."perfiles_usuario"
    ADD CONSTRAINT "perfiles_usuario_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pesos_opciones"
    ADD CONSTRAINT "pesos_opciones_opcion_id_fkey" FOREIGN KEY ("opcion_id") REFERENCES "public"."opciones"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts_foro"
    ADD CONSTRAINT "posts_foro_foro_id_fkey" FOREIGN KEY ("foro_id") REFERENCES "public"."foros"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts_foro"
    ADD CONSTRAINT "posts_foro_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."preguntas_comunidad"
    ADD CONSTRAINT "preguntas_comunidad_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."preguntas"
    ADD CONSTRAINT "preguntas_cuestionario_id_fkey" FOREIGN KEY ("cuestionario_id") REFERENCES "public"."cuestionarios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."programa_categorias"
    ADD CONSTRAINT "programa_categorias_programa_id_fkey" FOREIGN KEY ("programa_id") REFERENCES "public"."programas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."programas"
    ADD CONSTRAINT "programas_institucion_id_fkey" FOREIGN KEY ("institucion_id") REFERENCES "public"."instituciones"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recomendaciones"
    ADD CONSTRAINT "recomendaciones_programa_id_fkey" FOREIGN KEY ("programa_id") REFERENCES "public"."programas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recomendaciones"
    ADD CONSTRAINT "recomendaciones_resultado_id_fkey" FOREIGN KEY ("resultado_id") REFERENCES "public"."resultados"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reportes_pregunta"
    ADD CONSTRAINT "reportes_pregunta_pregunta_id_fkey" FOREIGN KEY ("pregunta_id") REFERENCES "public"."preguntas_comunidad"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reportes_pregunta"
    ADD CONSTRAINT "reportes_pregunta_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."respuestas_post"
    ADD CONSTRAINT "respuestas_post_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts_foro"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."respuestas_post"
    ADD CONSTRAINT "respuestas_post_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."respuestas_pregunta"
    ADD CONSTRAINT "respuestas_pregunta_pregunta_id_fkey" FOREIGN KEY ("pregunta_id") REFERENCES "public"."preguntas_comunidad"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."respuestas_pregunta"
    ADD CONSTRAINT "respuestas_pregunta_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resultados"
    ADD CONSTRAINT "resultados_cuestionario_id_fkey" FOREIGN KEY ("cuestionario_id") REFERENCES "public"."cuestionarios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resultados"
    ADD CONSTRAINT "resultados_perfil_usuario_id_fkey" FOREIGN KEY ("perfil_usuario_id") REFERENCES "public"."perfiles_usuario"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tablero_brota_miembros"
    ADD CONSTRAINT "tablero_brota_miembros_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tablero_brota_tareas"
    ADD CONSTRAINT "tablero_brota_tareas_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."votos_post"
    ADD CONSTRAINT "votos_post_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts_foro"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votos_post"
    ADD CONSTRAINT "votos_post_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Solo backend puede insertar sincronizacion" ON "public"."men_sincronizacion" FOR INSERT WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Solo backend puede leer sincronizacion" ON "public"."men_sincronizacion" FOR SELECT USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Todos pueden ver convocatorias activas" ON "public"."convocatorias" FOR SELECT USING (("fecha_cierre" >= CURRENT_DATE));



CREATE POLICY "Todos pueden ver cuestionarios activos" ON "public"."cuestionarios" FOR SELECT USING (("activo" = true));



CREATE POLICY "Todos pueden ver instituciones activas" ON "public"."instituciones" FOR SELECT USING (("activa" = true));



CREATE POLICY "Todos pueden ver opciones" ON "public"."opciones" FOR SELECT USING (true);



CREATE POLICY "Todos pueden ver perfiles vocacionales" ON "public"."perfiles_vocacionales" FOR SELECT USING (true);



CREATE POLICY "Todos pueden ver pesos" ON "public"."pesos_opciones" FOR SELECT USING (true);



CREATE POLICY "Todos pueden ver preguntas" ON "public"."preguntas" FOR SELECT USING (true);



CREATE POLICY "Todos pueden ver programas activos" ON "public"."programas" FOR SELECT USING (("activo" = true));



CREATE POLICY "Todos pueden ver roles" ON "public"."roles" FOR SELECT USING (true);



CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON "public"."perfiles_usuario" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuarios pueden insertar su propio perfil" ON "public"."perfiles_usuario" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuarios pueden insertar sus propios resultados" ON "public"."resultados" FOR INSERT WITH CHECK (("perfil_usuario_id" IN ( SELECT "perfiles_usuario"."id"
   FROM "public"."perfiles_usuario"
  WHERE ("perfiles_usuario"."user_id" = "auth"."uid"()))));



CREATE POLICY "Usuarios pueden ver su propio perfil" ON "public"."perfiles_usuario" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuarios pueden ver sus propias recomendaciones" ON "public"."recomendaciones" FOR SELECT USING (("resultado_id" IN ( SELECT "resultados"."id"
   FROM "public"."resultados"
  WHERE ("resultados"."perfil_usuario_id" IN ( SELECT "perfiles_usuario"."id"
           FROM "public"."perfiles_usuario"
          WHERE ("perfiles_usuario"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Usuarios pueden ver sus propios resultados" ON "public"."resultados" FOR SELECT USING (("perfil_usuario_id" IN ( SELECT "perfiles_usuario"."id"
   FROM "public"."perfiles_usuario"
  WHERE ("perfiles_usuario"."user_id" = "auth"."uid"()))));



CREATE POLICY "admins gestionan cuestionarios" ON "public"."cuestionarios" USING ("public"."is_admin"());



CREATE POLICY "admins gestionan instituciones" ON "public"."instituciones" USING ("public"."is_admin"());



CREATE POLICY "admins gestionan opciones" ON "public"."opciones" USING ("public"."is_admin"());



CREATE POLICY "admins gestionan perfiles_usuario" ON "public"."perfiles_usuario" USING ("public"."is_admin"());



CREATE POLICY "admins gestionan perfiles_vocacionales" ON "public"."perfiles_vocacionales" USING ("public"."is_admin"());



CREATE POLICY "admins gestionan pesos_opciones" ON "public"."pesos_opciones" USING ("public"."is_admin"());



CREATE POLICY "admins gestionan preguntas" ON "public"."preguntas" USING ("public"."is_admin"());



CREATE POLICY "admins gestionan programas" ON "public"."programas" USING ("public"."is_admin"());



CREATE POLICY "admins gestionan recomendaciones" ON "public"."recomendaciones" USING ("public"."is_admin"());



CREATE POLICY "admins gestionan resultados" ON "public"."resultados" USING ("public"."is_admin"());



CREATE POLICY "admins modifican todo" ON "public"."perfiles" USING ("public"."es_admin"());



CREATE POLICY "admins ven todo" ON "public"."perfiles" FOR SELECT USING ("public"."es_admin"());



ALTER TABLE "public"."contactos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contenido_rutas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."convocatorias" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cuestionarios" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."foros" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."historias" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."instituciones" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."likes_historia" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."men_sincronizacion" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."opciones" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."perfiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."perfiles_usuario" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."perfiles_vocacionales" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pesos_opciones" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posts_foro" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."preguntas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."preguntas_comunidad" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."programa_categorias" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."programas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public board read" ON "public"."tablero_brota_tareas" FOR SELECT TO "anon" USING (true);



CREATE POLICY "public board update state" ON "public"."tablero_brota_tareas" FOR UPDATE TO "anon" USING (true) WITH CHECK (true);



ALTER TABLE "public"."recomendaciones" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reportes_pregunta" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."respuestas_post" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."respuestas_pregunta" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resultados" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "solo_service_role" ON "public"."contactos" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "solo_service_role" ON "public"."contenido_rutas" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "solo_service_role" ON "public"."foros" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "solo_service_role" ON "public"."historias" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "solo_service_role" ON "public"."likes_historia" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "solo_service_role" ON "public"."posts_foro" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "solo_service_role" ON "public"."preguntas_comunidad" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "solo_service_role" ON "public"."reportes_pregunta" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "solo_service_role" ON "public"."respuestas_post" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "solo_service_role" ON "public"."respuestas_pregunta" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "solo_service_role" ON "public"."votos_post" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "tablero members read own membership" ON "public"."tablero_brota_miembros" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "tablero members read tasks" ON "public"."tablero_brota_tareas" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."tablero_brota_miembros" "m"
  WHERE ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "tablero members update state" ON "public"."tablero_brota_tareas" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."tablero_brota_miembros" "m"
  WHERE ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."tablero_brota_miembros" "m"
  WHERE ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



ALTER TABLE "public"."tablero_brota_miembros" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tablero_brota_tareas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "usuarios pueden actualizar su perfil" ON "public"."perfiles_usuario" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "usuarios pueden insertar su perfil" ON "public"."perfiles_usuario" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "usuarios pueden leer su perfil" ON "public"."perfiles_usuario" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."votos_post" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."es_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."es_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."es_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_tablero_brota_task_audit"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_tablero_brota_task_audit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_tablero_brota_task_audit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."contactos" TO "anon";
GRANT ALL ON TABLE "public"."contactos" TO "authenticated";
GRANT ALL ON TABLE "public"."contactos" TO "service_role";



GRANT ALL ON TABLE "public"."contenido_rutas" TO "anon";
GRANT ALL ON TABLE "public"."contenido_rutas" TO "authenticated";
GRANT ALL ON TABLE "public"."contenido_rutas" TO "service_role";



GRANT ALL ON TABLE "public"."convocatorias" TO "anon";
GRANT ALL ON TABLE "public"."convocatorias" TO "authenticated";
GRANT ALL ON TABLE "public"."convocatorias" TO "service_role";



GRANT ALL ON TABLE "public"."cuestionarios" TO "anon";
GRANT ALL ON TABLE "public"."cuestionarios" TO "authenticated";
GRANT ALL ON TABLE "public"."cuestionarios" TO "service_role";



GRANT ALL ON TABLE "public"."foros" TO "anon";
GRANT ALL ON TABLE "public"."foros" TO "authenticated";
GRANT ALL ON TABLE "public"."foros" TO "service_role";



GRANT ALL ON TABLE "public"."historias" TO "anon";
GRANT ALL ON TABLE "public"."historias" TO "authenticated";
GRANT ALL ON TABLE "public"."historias" TO "service_role";



GRANT ALL ON TABLE "public"."instituciones" TO "anon";
GRANT ALL ON TABLE "public"."instituciones" TO "authenticated";
GRANT ALL ON TABLE "public"."instituciones" TO "service_role";



GRANT ALL ON TABLE "public"."likes_historia" TO "anon";
GRANT ALL ON TABLE "public"."likes_historia" TO "authenticated";
GRANT ALL ON TABLE "public"."likes_historia" TO "service_role";



GRANT ALL ON TABLE "public"."men_sincronizacion" TO "anon";
GRANT ALL ON TABLE "public"."men_sincronizacion" TO "authenticated";
GRANT ALL ON TABLE "public"."men_sincronizacion" TO "service_role";



GRANT ALL ON SEQUENCE "public"."men_sincronizacion_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."men_sincronizacion_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."men_sincronizacion_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."opciones" TO "anon";
GRANT ALL ON TABLE "public"."opciones" TO "authenticated";
GRANT ALL ON TABLE "public"."opciones" TO "service_role";



GRANT ALL ON TABLE "public"."perfiles" TO "anon";
GRANT ALL ON TABLE "public"."perfiles" TO "authenticated";
GRANT ALL ON TABLE "public"."perfiles" TO "service_role";



GRANT ALL ON TABLE "public"."perfiles_usuario" TO "anon";
GRANT ALL ON TABLE "public"."perfiles_usuario" TO "authenticated";
GRANT ALL ON TABLE "public"."perfiles_usuario" TO "service_role";



GRANT ALL ON TABLE "public"."perfiles_vocacionales" TO "anon";
GRANT ALL ON TABLE "public"."perfiles_vocacionales" TO "authenticated";
GRANT ALL ON TABLE "public"."perfiles_vocacionales" TO "service_role";



GRANT ALL ON TABLE "public"."pesos_opciones" TO "anon";
GRANT ALL ON TABLE "public"."pesos_opciones" TO "authenticated";
GRANT ALL ON TABLE "public"."pesos_opciones" TO "service_role";



GRANT ALL ON TABLE "public"."posts_foro" TO "anon";
GRANT ALL ON TABLE "public"."posts_foro" TO "authenticated";
GRANT ALL ON TABLE "public"."posts_foro" TO "service_role";



GRANT ALL ON TABLE "public"."preguntas" TO "anon";
GRANT ALL ON TABLE "public"."preguntas" TO "authenticated";
GRANT ALL ON TABLE "public"."preguntas" TO "service_role";



GRANT ALL ON TABLE "public"."preguntas_comunidad" TO "anon";
GRANT ALL ON TABLE "public"."preguntas_comunidad" TO "authenticated";
GRANT ALL ON TABLE "public"."preguntas_comunidad" TO "service_role";



GRANT ALL ON TABLE "public"."programa_categorias" TO "anon";
GRANT ALL ON TABLE "public"."programa_categorias" TO "authenticated";
GRANT ALL ON TABLE "public"."programa_categorias" TO "service_role";



GRANT ALL ON TABLE "public"."programas" TO "anon";
GRANT ALL ON TABLE "public"."programas" TO "authenticated";
GRANT ALL ON TABLE "public"."programas" TO "service_role";



GRANT ALL ON TABLE "public"."recomendaciones" TO "anon";
GRANT ALL ON TABLE "public"."recomendaciones" TO "authenticated";
GRANT ALL ON TABLE "public"."recomendaciones" TO "service_role";



GRANT ALL ON TABLE "public"."reportes_pregunta" TO "anon";
GRANT ALL ON TABLE "public"."reportes_pregunta" TO "authenticated";
GRANT ALL ON TABLE "public"."reportes_pregunta" TO "service_role";



GRANT ALL ON TABLE "public"."respuestas_post" TO "anon";
GRANT ALL ON TABLE "public"."respuestas_post" TO "authenticated";
GRANT ALL ON TABLE "public"."respuestas_post" TO "service_role";



GRANT ALL ON TABLE "public"."respuestas_pregunta" TO "anon";
GRANT ALL ON TABLE "public"."respuestas_pregunta" TO "authenticated";
GRANT ALL ON TABLE "public"."respuestas_pregunta" TO "service_role";



GRANT ALL ON TABLE "public"."resultados" TO "anon";
GRANT ALL ON TABLE "public"."resultados" TO "authenticated";
GRANT ALL ON TABLE "public"."resultados" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."tablero_brota_miembros" TO "service_role";
GRANT SELECT ON TABLE "public"."tablero_brota_miembros" TO "authenticated";



GRANT ALL ON TABLE "public"."tablero_brota_tareas" TO "service_role";
GRANT SELECT ON TABLE "public"."tablero_brota_tareas" TO "authenticated";
GRANT SELECT ON TABLE "public"."tablero_brota_tareas" TO "anon";



GRANT UPDATE("estado") ON TABLE "public"."tablero_brota_tareas" TO "authenticated";
GRANT UPDATE("estado") ON TABLE "public"."tablero_brota_tareas" TO "anon";



GRANT ALL ON TABLE "public"."votos_post" TO "anon";
GRANT ALL ON TABLE "public"."votos_post" TO "authenticated";
GRANT ALL ON TABLE "public"."votos_post" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







