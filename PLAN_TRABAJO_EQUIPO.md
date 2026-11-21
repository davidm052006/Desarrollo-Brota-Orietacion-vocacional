# Plan de trabajo — vistas por tipo de pregunta (web) + CRUD de cuestionarios (móvil)

> Generado el 2026-09-27 auditando el código real de los dos repos.
> Cuatro asignaciones independientes: **Mateo**, **Brayan**, **Julián**, **Eduard**.
> Cada quien trabaja en su rama y abre **PR hacia `develop`**.

---

## 1. Qué nos pidieron

1. **Web** — que *cada tipo de pregunta del test vocacional tenga su propia vista*,
   en vez del componente único con `if`s que hay hoy.
2. **Móvil** — un **CRUD completo** de cuestionarios / preguntas / opciones en
   `brota_flutter_app/` (repo hermano, `../brota_flutter_app`).

---

## 2. Estado real del código (verificado, léanlo antes de empezar)

### 2.1 El campo `tipo` hoy tiene cinco escrituras distintas

`preguntas.tipo` es un `VARCHAR(50)` libre (`backend/setup_database.sql:89`), sin
CHECK ni enum. Cada parte del sistema escribe/lee un vocabulario propio:

| Dónde | Valor que usa | Archivo |
|---|---|---|
| Runner del test (escala) | `likert` | `frontend/src/pages/dashboard/test-vocacional/components/TestQuestion.jsx:57` |
| Runner del test (checkbox) | `multiple` | `TestQuestion.jsx:58` |
| Runner del test (selección única) | `single` | `TestVocacional.jsx:246` |
| CRUD admin | `opcion_multiple` | `frontend/src/pages/dashboard/admin/sections/PreguntasSection.jsx:17,40` |
| CRUD institución | `seleccion` | `frontend/src/pages/dashboard/institucion/Cuestionarios.jsx:70` |

**Consecuencia real**: una pregunta creada desde el panel admin (`opcion_multiple`)
o desde institución (`seleccion`) no matchea ninguna rama de `TestQuestion.jsx`,
así que cae al render "grid" sin comportarse como múltiple ni como única.
Arreglar esto es el paso 1 de todo lo demás.

### 2.2 Los dos CRUD de preguntas del backend no son equivalentes

- `backend/src/controllers/admin/preguntasController.js` escribe el campo
  **legado** `preguntas.opciones` (JSONB) — que el motor del test **no lee**.
- `backend/src/controllers/institucion/preguntasController.js` sí gestiona las
  tablas relacionales `opciones` + `pesos_opciones`, que son las que el test usa
  de verdad (ver `perfilController.obtenerCuestionario`).

➡️ **El móvil debe hablar con `/api/institucion/*`, no con `/api/admin/*`.**

### 2.3 Estado del móvil

`brota_flutter_app` tiene Clean Architecture por feature
(`domain` ← `data`, `presentation` → `domain`), Riverpod, Dio con
`auth_interceptor`, go_router. Solo `auth`, `dashboard` y `profesiones` están
implementadas; `test_vocacional`, `comunidad`, etc. son placeholders de 20 líneas.
`profesiones` es el ejemplo a copiar (repositorio abstracto + impl con Dio +
`Result`/`Failure` + controller `StateNotifier`).

---

## 3. Reglas de trabajo

- **Repo web**: `Desarrollo-Brota-Orietacion-vocacional`. Ramas ya existentes:
  `brayan`, `julian`, `eduard` (Mateo crea `mateo` desde `develop`).
- **Repo móvil**: `brota_flutter_app` (`davidm052006/brota-flutter-app`).
  **Paso 0 (David)**: crear la rama `develop` desde `master` y las ramas
  `julian` / `eduard`. Ningún PR móvil va contra `master`.
- Antes de empezar: `git fetch origin && git rebase origin/develop`.
- **Un PR por persona**, hacia `develop`, con: qué hace, cómo probarlo y captura
  (web) o screen recording (móvil).
- Nadie mergea su propio PR: lo revisa otro del equipo.
- No tocar archivos fuera del alcance de tu tarea — así los 4 PRs no chocan.
- Commits en español, imperativo: `Agrega vista Likert del test vocacional`.

### Orden de integración (importante)

```
Mateo (base de tipos)  ──►  Brayan (las 3 vistas)          [repo web]
Julián (domain+data)   ──►  Eduard (pantallas CRUD)        [repo móvil]
```

Mateo y Julián abren PR primero. Brayan y Eduard **no quedan bloqueados**:
Brayan desarrolla sus componentes como archivos nuevos y los conecta al hacer
rebase; Eduard trabaja contra un repositorio falso en memoria (ver §4.4).

---

## 4. Asignaciones

### 4.1 Mateo — repo **web**, rama `mateo`: catálogo único de tipos + dispatcher

Es la tarea base: nadie más puede alinear nada mientras el vocabulario de tipos
siga roto.

**Archivos a crear**
- `frontend/src/utils/tiposPregunta.js`

**Archivos a modificar**
- `frontend/src/pages/dashboard/test-vocacional/components/TestQuestion.jsx`
- `frontend/src/pages/dashboard/test-vocacional/TestVocacional.jsx` (solo `toggleOpcion`)
- `backend/src/controllers/admin/preguntasController.js`
- `backend/src/controllers/institucion/preguntasController.js`

**Qué hacer**

1. `tiposPregunta.js` — fuente única de verdad:
   ```js
   export const TIPOS_PREGUNTA = {
     opcion_unica:    { label: 'Opción única',    multiple: false, descripcion: '...' },
     opcion_multiple: { label: 'Opción múltiple', multiple: true,  descripcion: '...' },
     likert:          { label: 'Escala Likert',   multiple: false, descripcion: '...' },
   };
   const ALIAS = { single: 'opcion_unica', seleccion: 'opcion_unica',
                   multiple: 'opcion_multiple' };
   export function normalizarTipo(tipo) { /* alias → clave canónica, default opcion_unica */ }
   export function esSeleccionMultiple(tipo) { /* usa TIPOS_PREGUNTA */ }
   export const OPCIONES_TIPO = /* [{ value, label }] para los <select> del CRUD */;
   ```
   Los alias son obligatorios: **ya hay preguntas en la base con los valores
   viejos** y no las vamos a migrar a mano.
2. `TestQuestion.jsx` pasa a ser un *dispatcher* delgado: mantiene el badge de
   categoría, el título (`splitTexto`) y la barra de navegación, y delega el
   cuerpo de opciones al componente registrado para `normalizarTipo(pregunta.tipo)`.
   El registro vive en `components/tipos/index.js` (Brayan llena los componentes;
   tú dejas el registro y un placeholder por tipo para no bloquearte).
3. `TestVocacional.jsx:246` — reemplazar
   `if (tipo === 'single' || tipo === 'likert')` por `if (!esSeleccionMultiple(tipo))`.
4. Backend: validar `tipo` contra el catálogo en los dos `preguntasController`
   (crear y actualizar) → `400` con mensaje claro si no es válido, y normalizar
   alias antes de escribir, para que la base deje de ensuciarse.

**Criterios de aceptación**
- Una pregunta guardada como `seleccion`, `single`, `multiple` u `opcion_multiple`
  se renderiza y se responde correctamente.
- Un `tipo` desconocido cae a `opcion_unica` con `console.warn`, nunca pantalla en blanco.
- `TestVocacional.test.jsx` sigue en verde + test nuevo de `normalizarTipo`.
- `POST /api/institucion/preguntas` con `tipo: "cualquier_cosa"` responde 400.

---

### 4.2 Brayan — repo **web**, rama `brayan`: una vista por tipo

**Archivos a crear** (todos bajo `frontend/src/pages/dashboard/test-vocacional/components/tipos/`)
- `PreguntaOpcionUnica.jsx` — grid de tarjetas, indicador **circular** (radio),
  al elegir una se deselecciona la anterior. Copy: *"Elige la opción que mejor te represente."*
- `PreguntaOpcionMultiple.jsx` — grid, indicador **cuadrado** (checkbox), contador
  "N seleccionadas" y la ayuda *"💡 Puedes seleccionar varias opciones"*.
- `PreguntaLikert.jsx` — escala horizontal con la línea de track y los logos
  (`LIKERT_MARKS`: triste → feliz), etiqueta bajo cada punto, punto activo escalado.
- `tipos/index.js` — mapa `{ clave de tipo → componente }` que consume el dispatcher de Mateo.

**Archivos a modificar**
- `frontend/src/pages/dashboard/admin/sections/PreguntasSection.jsx`
- `frontend/src/pages/dashboard/institucion/Cuestionarios.jsx`

**Qué hacer**

1. Extraer de `TestQuestion.jsx` el render de opciones y partirlo en los tres
   componentes. Cada uno recibe el mismo contrato:
   `{ pregunta, opciones, seleccionadas, onSeleccionar }` y devuelve **solo** el
   cuerpo de opciones (el header y los botones de navegación los pone el dispatcher).
2. Que las tres vistas se **vean distintas de verdad**, no solo el indicador:
   única = 1 columna con opción más alta; múltiple = grid 2 columnas; Likert = escala.
   Responsive: 1 columna por debajo de 640 px en las dos de tarjetas, y Likert con
   scroll horizontal en móvil.
3. Accesibilidad mínima: `role="radio"` / `role="checkbox"` con `aria-checked`,
   navegación con teclado (Tab + Enter/Espacio) y foco visible.
4. Los dos `<select>` de tipo (admin e institución) dejan de tener valores
   hardcodeados y se llenan desde `OPCIONES_TIPO`, mostrando la descripción del
   tipo elegido debajo. Los badges de color de `PreguntaSection` cubren los 3 tipos.

**Criterios de aceptación**
- Crear una pregunta de cada tipo desde el panel de institución y verla renderizada
  con su vista correspondiente al tomar el test.
- Test de render por tipo (React Testing Library): que `opcion_unica` deje solo una
  selección activa y `opcion_multiple` permita varias.
- Sin regresiones visuales en el flujo completo del test.

> Depende del PR de Mateo. Empieza por los componentes (son archivos nuevos) y
> haz rebase cuando su PR entre a `develop`.

---

### 4.3 Julián — repo **móvil**, rama `julian`: `domain` + `data` de `cuestionarios`

Feature nueva `lib/features/cuestionarios/`, siguiendo exactamente el patrón de
`lib/features/profesiones/`.

**Archivos a crear**
```
lib/features/cuestionarios/
  domain/
    cuestionario.dart              # id, nombre, version, descripcion, activo, numPreguntas
    pregunta.dart                  # id, cuestionarioId, texto, tipo, orden, categoria, peso, opciones
    opcion_pregunta.dart           # id, label, icon, orden, pesos: Map<String,int>
    tipo_pregunta.dart             # enum: opcionUnica, opcionMultiple, likert + fromApi/toApi con los alias
    cuestionarios_repository.dart  # contrato abstracto
  data/
    cuestionarios_repository_impl.dart
```

**Contrato mínimo** (CRUD completo, los tres niveles):
```dart
Future<Result<List<Cuestionario>>> getCuestionarios();
Future<Result<Cuestionario>>       crearCuestionario(NuevoCuestionario input);
Future<Result<Cuestionario>>       actualizarCuestionario(String id, ...);
Future<Result<void>>               eliminarCuestionario(String id);
Future<Result<List<Pregunta>>>     getPreguntas(String cuestionarioId);
Future<Result<Pregunta>>           crearPregunta(NuevaPregunta input);   // incluye opciones + pesos
Future<Result<Pregunta>>           actualizarPregunta(String id, ...);   // reemplaza sus opciones
Future<Result<void>>               eliminarPregunta(String id);
```

**Endpoints** (todos `/api/institucion`, requieren sesión con rol institución):
`GET|POST /cuestionarios`, `PATCH|DELETE /cuestionarios/:id`,
`GET|POST /preguntas`, `PATCH|DELETE /preguntas/:id`.
Las opciones **no tienen endpoint propio**: viajan anidadas en el body de la
pregunta como `opciones: [{ label, icon, orden, pesos: { categoria: puntos } }]`
y el backend reemplaza las filas de `opciones`/`pesos_opciones`. El `GET` las
devuelve ya aplanadas con `pesos` como mapa.

**Qué más hacer**
- `tipo_pregunta.dart` replica el catálogo del web, **incluidos los alias**
  (`single`/`seleccion` → opcionUnica, `multiple` → opcionMultiple) y un fallback
  seguro para tipos desconocidos. Coordina el vocabulario con Mateo.
- Errores: `DioException` → `mapDioExceptionToFailure`, nunca excepciones crudas
  hacia arriba. Un 403 (usuario sin rol institución) debe dar un `Failure` con
  mensaje entendible, no "error desconocido".
- `presentation/providers/cuestionarios_providers.dart` con el provider del
  repositorio (solo eso; las pantallas son de Eduard).
- Tests en `test/features/cuestionarios/` con `mocktail` sobre un `Dio` mockeado:
  al menos un caso feliz y uno de error por cada método.

**Criterios de aceptación**
- `flutter analyze` sin warnings y `flutter test` en verde.
- El dominio no importa Dio, Supabase ni Flutter (regla de dependencia).
- Un `README` corto en la carpeta de la feature con el mapeo método → endpoint.

---

### 4.4 Eduard — repo **móvil**, rama `eduard`: pantallas del CRUD

**Archivos a crear**
```
lib/features/cuestionarios/presentation/
  controllers/  cuestionarios_controller.dart   # lista + crear/editar/eliminar
                preguntas_controller.dart       # preguntas de un cuestionario
  screens/      cuestionarios_screen.dart       # lista con estados loading/error/vacío
                cuestionario_form_screen.dart   # crear / editar cuestionario
                preguntas_screen.dart           # preguntas de un cuestionario
                pregunta_form_screen.dart       # crear / editar pregunta
  widgets/      cuestionario_card.dart
                pregunta_tile.dart              # muestra el badge del tipo
                opciones_editor.dart            # agregar/quitar/reordenar opciones + pesos
```

**Archivos a modificar**
- `lib/core/router/app_router.dart` — rutas `/dashboard/cuestionarios`,
  `/dashboard/cuestionarios/:id/preguntas` y sus formularios.
- `lib/core/router/dashboard_shell.dart` — entrada de navegación, **visible solo
  para usuarios con rol institución**.

**Qué hacer**

1. Las 4 operaciones completas en los dos niveles: listar, crear, editar y
   eliminar cuestionarios; y lo mismo para las preguntas de cada cuestionario.
   Eliminar siempre pide confirmación (`AlertDialog`) y avisa que borra en cascada.
2. `opciones_editor.dart` es el widget con más chicha: lista editable de opciones
   con label, emoji/icono, orden y el mapa de pesos por categoría. Mínimo 2
   opciones para guardar; Likert espera 5 (advertir, no bloquear).
3. El formulario de pregunta **cambia según el tipo elegido**, en paralelo a lo
   que Brayan hace en el web: única/múltiple piden lista de opciones con pesos,
   Likert pre-carga las 5 etiquetas de la escala.
4. Estados de UI completos: cargando (skeleton o spinner), error con botón de
   reintentar, y vacío con llamada a la acción. Nada de pantalla en blanco.
5. Respeta los tokens de `lib/core/theme/` — cero colores hardcodeados.

**Cómo avanzar sin esperar a Julián**: crea en tu rama un
`FakeCuestionariosRepository` en memoria que implemente el mismo contrato y
apunta el provider a él. Cuando entre el PR de Julián, cambias el provider al
repositorio real y borras el fake (o lo dejas bajo `test/` como doble de prueba).
Acuerden el contrato entre ustedes dos **antes** de escribir código.

**Criterios de aceptación**
- Flujo completo demostrable: crear cuestionario → agregarle 3 preguntas (una de
  cada tipo) → editar una → borrarla → borrar el cuestionario.
- `flutter analyze` limpio, `flutter test` en verde, y un test de widget por pantalla.
- Screen recording del flujo en el PR.

---

## 5. Checklist antes de abrir el PR

- [ ] Rebase sobre `develop` al día y sin conflictos.
- [ ] Solo tus archivos en el diff (nada de `node_modules`, `.env`, `build/`, `pubspec.lock` ajeno).
- [ ] Web: `npm run lint` y `npm test` (vitest) en `frontend/`; `npm test` (jest) en `backend/` si lo tocaste.
- [ ] Móvil: `flutter analyze` y `flutter test`.
- [ ] Descripción del PR: qué hace, cómo probarlo paso a paso, captura o video.
- [ ] Marcado el PR del que dependes, si aplica.
