# Modelo de datos — Brota

> Reemplaza a `docs/archivo/02-Desarrollo/2.1 Arquitectura/Base_de_datos.md`, que describe un diseño conceptual previo (PKs `INT`, tablas `Usuario`/`Carrera`/`PerfilVocacional` en singular) que **no coincide con la implementación real**. Ese archivo se deja en `archivo/` como referencia histórica, no se actualiza más.
>
> Generado a partir de `backend/setup_database.sql` + `backend/scripts/migration_*.sql`, y verificado contra la base de Supabase real (2026-08-15). Todas las PK son `UUID DEFAULT gen_random_uuid()` salvo donde se indica.

## Núcleo: usuarios y test vocacional

| Tabla | Columnas clave | Relaciones |
|---|---|---|
| `perfiles_usuario` | `user_id` (FK → `auth.users`), `rol` (`estudiante`\|`orientador`\|`admin`, string directo — **no** hay tabla `roles` separada), `nombre`, `apellido`, `edad`, `ciudad`, `nivel_educativo`, `condiciones_socioeconomicas` | 1:1 con `auth.users` |
| `cuestionarios` | `nombre`, `version`, `activo` | 1:N → `preguntas` |
| `preguntas` | `cuestionario_id` (FK), `texto`, `tipo` (`likert`\|`opcion_multiple`), `orden`, `categoria`, `peso`, `opciones` (JSONB, legado) | N:1 ← `cuestionarios`; 1:N → `opciones` |
| `opciones` | `pregunta_id` (FK), `label`, `icon`, `orden` | N:1 ← `preguntas`; 1:N → `pesos_opciones` |
| `pesos_opciones` | `opcion_id` (FK), `categoria`, `puntos` | N:1 ← `opciones` |
| `resultados` | `perfil_usuario_id` (FK), `cuestionario_id` (FK), `respuestas` (JSONB), `perfil_vocacional` (JSONB) | 1:N → `recomendaciones` |
| `recomendaciones` | `programa_id` (FK), `resultado_id` (FK), `compatibilidad`, `razones` (TEXT con JSON serializado, ver bug #2 de `CLAUDE.md`), `vista` | N:1 ← `resultados`, N:1 ← `programas` |
| `perfiles_vocacionales` | `categoria` (UNIQUE), `emoji`, `titulo`, `descripcion`, `color` | catálogo estático de las áreas vocacionales |

## Oferta educativa

| Tabla | Columnas clave | Relaciones |
|---|---|---|
| `instituciones` | `nombre`, `tipo`, `ciudad`, `departamento`, `costo_promedio` | 1:N → `programas` |
| `programas` | `institucion_id` (FK), `nombre`, `area_academica`, `modalidad`, `costo_matricula`, `perfil_compatible` (JSONB) | N:1 ← `instituciones`; sincronizado desde la API del MEN (ver `sincronizacionController.js`) |
| `men_sincronizacion` | `ejecutada_en`, `remote_timestamp`, `programas_importados`, `instituciones_importadas`, `estado` | registro de auditoría de cada corrida de sync MEN |

## Contacto

| Tabla | Columnas clave | Relaciones |
|---|---|---|
| `contactos` | `nombre`, `email`, `telefono`, `asunto`, `mensaje`, `estado` (`pendiente`\|`leido`\|`respondido`\|`archivado`), `notas_admin` | sin FK; alimentada por el formulario público `/contacto`. RLS restringido a `service_role` (solo el backend accede, nunca el cliente directo) |

## Comunidad

✅ Las 8 tablas + `reportes_pregunta` ya están creadas en Supabase (`migration_comunidad.sql` y `migration_reportes_preguntas.sql`, corridas el 2026-08-15 — antes de esa fecha ninguna existía, causa raíz del error `Could not find the table 'public.preguntas_comunidad'`).

| Tabla | Columnas clave | Relaciones |
|---|---|---|
| `foros` | `id` (TEXT, no UUID), `icon`, `nombre`, `descripcion` | 1:N → `posts_foro` |
| `posts_foro` | `foro_id` (FK), `user_id` (FK → `auth.users`), `titulo`, `contenido`, `anonimo`, `votos` | N:1 ← `foros`; 1:N → `votos_post`, `respuestas_post` |
| `votos_post` | `post_id` (FK), `user_id` (FK), `direccion` (`up`\|`down`) | UNIQUE(`post_id`,`user_id`) — un voto por usuario |
| `respuestas_post` | `post_id` (FK), `user_id` (FK), `contenido`, `votos`, `es_mejor_respuesta` | N:1 ← `posts_foro` |
| `historias` | `user_id` (FK), `titulo`, `contenido`, `area`, `publicada` (requiere moderación), `likes` | 1:N → `likes_historia` |
| `likes_historia` | `historia_id` (FK), `user_id` (FK) | UNIQUE(`historia_id`,`user_id`) |
| `preguntas_comunidad` | `user_id` (FK), `titulo`, `area`, `resuelta` | **no confundir con `preguntas`** (esa es del cuestionario del test vocacional) — nombres distintos a propósito por esta ambigüedad |
| `respuestas_pregunta` | `pregunta_id` (FK → `preguntas_comunidad`), `user_id` (FK), `contenido`, `votos`, `es_mejor` | N:1 ← `preguntas_comunidad` |
| `reportes_pregunta` | `pregunta_id` (FK → `preguntas_comunidad`), `user_id` (FK), `motivo` | UNIQUE(`pregunta_id`,`user_id`) — un reporte por usuario. Al llegar a 3, `perfiles_usuario.baneado_preguntas_hasta` del autor se pone en `NOW() + 7 días` (ver `preguntasController.reportarPregunta`) |
| `convocatorias` | `tipo`, `titulo`, `institucion`, `ciudad`, `detalles` (JSONB), `url`, `fecha_cierre`, `activa` | ✅ existe y tiene datos (5 filas semilla). **Ojo:** `backend/setup_database.sql` todavía define `convocatorias` con OTRO esquema (`programa_id`/`nombre`/`fecha_apertura`/`cupos`) que no es el que está realmente en producción — ese archivo quedó desactualizado para esta tabla específica, pendiente de corregir. |

## Notas de consistencia código↔DB encontradas en esta revisión

- `verificarAdmin.js` compara `perfiles_usuario.rol === 'admin'` directamente — esto es correcto para el esquema actual. La entrada del bug #8 en `CLAUDE.md` (que menciona una tabla `roles` con columna `nombre`) describe un diseño anterior ya reemplazado; si se vuelve a tocar ese middleware, usar `rol` como columna directa, no reintroducir el join a `roles`.
- `preguntas` (cuestionario) y `preguntas_comunidad` (foro de dudas) son tablas distintas con propósitos distintos — al leer código o logs, confirmar de cuál se habla antes de asumir.
- **Patrón recurrente encontrado dos veces (2026-08-15):** el código de un feature se escribe y mergea antes de que alguien corra su script de migración en Supabase — pasó con `migration_comunidad.sql` (comunidad completa) y con `contactos_migration.sql` (formulario de contacto), ambos ya corregidos y ejecutados. Si aparece de nuevo el error `Could not find the table 'X' in the schema cache`, primero revisar si existe un `backend/scripts/migration_*.sql` para esa tabla que nunca se ejecutó, antes de asumir que falta escribirlo desde cero.
- Todos los scripts de migración deberían vivir en `backend/scripts/migration_*.sql` — `contactos_migration.sql` estaba suelto en `docs/` con otro patrón de nombre; ya se movió y renombró a `backend/scripts/migration_contactos.sql` para que quede junto a los demás.
