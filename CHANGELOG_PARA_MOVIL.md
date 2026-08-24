# Changelog para la app móvil

Registro incremental de cambios en este repo (web/backend) que afectan a
`~/Proyectos/brota_flutter_app/`. Ver `CLAUDE.md` sección "Sincronización
con la app móvil" para la regla de cuándo agregar una entrada.

Formato: `## AAAA-MM-DD — hash-corto — resumen` + 1-3 líneas de qué
cambió y por qué le importa al móvil. Más nuevo arriba.

---

## 2026-08-23 — `314576c` — más campos en las recomendaciones del test

`GET /api/perfil/recomendaciones/:resultadoId` (mismo endpoint, no es
nuevo) ahora devuelve más campos por recomendación: `requisitos` y
`costoMatricula` del programa; `institucionTipo`, `direccion`,
`telefono`, `email`, `sitioWeb`, `costoPromedioInstitucion` de la
institución. Se usan para un modal de detalle nuevo en el resultado
del test vocacional (web). El campo `razones` ya existía en la
respuesta pero antes nadie lo parseaba (viene como JSON string).

## 2026-08-23 — auditoría retroactiva (commits hasta `d083446`)

No es una entrada de un cambio puntual — es el punto de partida: la app
móvil auditó este repo completo (backend + frontend + `git log --since
2026-08-05`) porque no existía este changelog todavía. El resultado
completo vive en `brota_flutter_app/WEB_PARITY_ROADMAP.md`. Resumen de
lo que encontró desactualizado en los briefs del móvil:

- Dashboard rediseñado por completo (`fbef308`): `HeroBanner`/
  `QuickActions`/`ContinueSection` se borraron, ahora es
  `BannerCarousel`+`FeedReciente`+`ProfileSidebar`.
- `/dashboard/rutas` pasó de placeholder a implementación real
  (`9564818`).
- Pantallas nuevas sin equivalente móvil: Perfil, Racha, Broti,
  Notificaciones (reemplazó "Mensajes").
- Sistema de personalización de la mascota ("Broti"): `perfiles_usuario.
  broti_config`, `PATCH /api/perfil/:userId/broti`, catálogo en
  `frontend/src/utils/brotiCatalog.js`. El móvil ya usa la misma mascota
  pero no sabía que se llama Broti ni que existe este sistema.
- Racha (`racha_dias`) sí tiene datos reales vía `GET /api/perfil/
  :userId` — el móvil asumía que no había fuente de datos.
- Rol moderador + moderación de comunidad, analíticas de admin, export a
  PDF del resultado del test, auto-logout a los 30 min de inactividad —
  todos nuevos desde agosto.
- Confirmado sin cambios: paleta de colores (`#21BD68`/`#34D27D` etc.),
  OAuth de Google sigue sin implementarse.

A partir de acá, cada entrada nueva debería ser mucho más corta que esto
— esto fue el costo de no tener el changelog desde el principio.
