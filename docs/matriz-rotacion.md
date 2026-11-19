# Matriz de rotación — Semanas 1 a 6

Capa de cada integrante por semana. Fuente: reparto del "Plan de pruebas Brota"
(S2 `[Front, API, BD, E2E]`, S4 `[API, BD, E2E, Front]`, S5 `[BD, E2E, Front, API]`
en el orden David, Brayan, Julian, Edward), corregido con lo que de verdad se
subió en los PR. La S3 no rota: todos hacen pruebas de componente (Front).

| Integrante | S1 | S2 | S3 | S4 | S5 | S6 |
|---|---|---|---|---|---|---|
| David | E2E | Front | Front | BD ¹ | Front ² | por definir (no Front) |
| Brayan | E2E | API | Front | por confirmar ³ | E2E | por definir (no E2E) |
| Julian | E2E | BD | Front | E2E | API | BD |
| Edward | E2E | E2E | Front | Front | BD ⁴ | por definir (no BD) |

## Qué hizo cada uno y dónde está la evidencia

| Semana | Integrante | Unidad o flujo | PR | Estado (16 nov 2026) |
|---|---|---|---|---|
| S1 | Edward | E2E: inicio de sesión exitoso (`login-success.spec.js`) | rama `semana-01-test` | Sin fusionar |
| S1 | Brayan | E2E: contraseña incorrecta muestra error (`login-invalid-password.spec.js`) | rama `semana-01-test` | Sin fusionar |
| S1 | Julian | E2E: registro valida campos vacíos (`signup-validation.spec.js`) | rama `semana-01-test` | Sin fusionar |
| S1 | David | E2E: login vacío muestra validaciones (`login-validation.spec.js`) | rama `semana-01-test` | Ya está en `main` y corre en CI |
| S2 | David | Front: `validation.js` | #50 | Abierto |
| S2 | Brayan | API: `algoritmoRecomendacion.js` | — | Sin PR de Brayan (Edward abrió #49 con esa unidad) |
| S2 | Julian | BD: `calcularEdad.js` + DEF (#54) | #55 | Abierto |
| S2 | Edward | E2E: CI + 3 tests de otra unidad | #48, #49 | Abiertos (#48 lo reemplaza #55) |
| S3 | David | `LoginCard.jsx` (RTL) | #51 | Abierto |
| S3 | Brayan | `FeedReciente.jsx` (RTL) | — | Sin PR |
| S3 | Julian | `ModalHacerPregunta.jsx` (RTL) + DEF-02 (#56) | #57 | Abierto |
| S3 | Edward | `TopNavbar.jsx` (RTL) | — | Sin PR |
| S4 | David | BD: contratos de programas con Supabase simulado | #52 | Abierto (borrador) |
| S4 | Brayan | — | — | Sin PR |
| S4 | Julian | E2E: seguridad 401/403 y contrato de errores + DEF-03 (#58), DEF-04 (#59) | #60 | Abierto |
| S4 | Edward | Front: contratos que consume la interfaz | — | Sin PR |
| S5 | David | Front: `programasService` con MSW | #53 | Fusionado en `test/semana-05` |
| S5 | Brayan | E2E: dobles con `page.route` | — | Sin PR ⁵ |
| S5 | Julian | API: sincronización MEN (stub, mock, fake, spy de reloj) | #62 | Abierto, CI verde |
| S5 | Julian | E2E extra: login con `page.route` (400, red caída, 429) | #64 | Abierto, CI verde |
| S5 | Edward | BD: capa con repositorio Supabase simulado | — | Sin PR |
| S6 | Julian | BD: montaje de la BD de pruebas (Supabase local) + `programasRepository` contra la BD real + DEF-05 (#80), DEF-06 (#81) | #79, PR de S6 | Abierto |

## Notas para cerrar en equipo

1. **S4 David:** el plan le daba API, pero su PR #52 es de BD. Así queda.
2. **S5 David:** repite Front (ya lo tuvo en S2). El reto pide no repetir capa; se deja
   registrado porque el PR #53 ya está fusionado.
3. **S4 Brayan:** el plan le daba BD, que tomó David. La única capa libre es API, pero
   ya la tuvo en S2. Brayan y el equipo deciden cuál registra.
4. **S5 Edward:** el plan le daba API, que tomó Julian (#62). Le queda BD, la única capa
   sin dueño en S5 y que no ha repetido.
5. **S5 E2E:** el mínimo de 2 pruebas con `page.route` ya lo cubre #64. Brayan igual
   debe subir sus 3 tests con dobles en la capa E2E (por ejemplo, lista vacía o error
   de validación en otra pantalla).
6. El nombre se escribe **Edward** en todo el documento, como pide el plan (antes
   aparecía como "Eduard").

## Línea base de cobertura

Medición local del 12 de octubre de 2026, con cobertura incluyendo todos los
archivos de código fuente (`src/`) y excluyendo pruebas/configuración:

| Paquete | Sentencias | Ramas | Funciones | Líneas |
|---|---:|---:|---:|---:|
| Backend (Jest) | 32.81% | 15.21% | 20.57% | 35.85% |
| Frontend (Vitest + V8) | 8.79% | 9.63% | 5.10% | 9.49% |

Estos porcentajes son también los umbrales mínimos configurados para CI. Si se
añaden archivos o cambia la instrumentación, volver a medir y revisar la línea
base en equipo antes de modificar los umbrales.

## Cierre de la semana 6: cobertura real y umbral del 70%

Medida el 19 nov 2026 **sin** `DATABASE_URL`, que es lo que mide el CI hoy (los tests de integración se saltan). Umbral = el mayor entre 70 y la cobertura real redondeada hacia abajo.

| Parte | Sentencias | Ramas | Funciones | Líneas | Umbral en CI |
|---|---:|---:|---:|---:|---|
| Backend (Jest) | 84.87% | 72.69% | 82.80% | 87.57% | 84 / 72 / 82 / 87 |
| Frontend (Vitest + V8) | 81.42% | 73.01% | 75.22% | 82.21% | 81 / 73 / 75 / 82 |

Antes de la Parte 4: backend ramas 67.89%; frontend ramas 62.87% y funciones 65.38%. Lo que las subió:
- **Backend:** pruebas de los CRUD del panel admin (programas, instituciones, solicitudes de contacto) y del formulario público de contacto (`tests/controllers/catalogosYContacto.test.js`), más las reglas nuevas de DEF-05 con su test unitario.
- **Frontend:** pruebas de seis páginas que estaban al 0% (Rutas, BannerCarousel, Perfil con GlassSelect, Broti, MisProgramas y Ajustes), y los tests de `services/servicios.test.js` que la integración del 18 nov había dejado fuera (#78).
