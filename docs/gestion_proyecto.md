# 📊 Gestión del Proyecto - Sistema Brota

## GitHub Projects - Kanban Board

El proyecto Brota utiliza GitHub Projects con metodología Kanban para gestionar el desarrollo.

**Tablero real:** [github.com/users/davidm052006/projects/1](https://github.com/users/davidm052006/projects/1) ("issus BROTA")

## ⚠️ Estado real vs. este documento (auditoría 26 ago 2026)

Este documento describe el proceso **ideal** que se pensó al crear el tablero (marzo 2026). Dos cosas no coinciden con la realidad y hay que saberlo antes de mostrar el tablero en vivo:

1. **Las columnas reales del tablero son `Backlog` / `Ready` / `In progress` / `In review`** — no existe una columna `Done` como describe la sección siguiente. `Ready` es la que cumple ese rol (a donde se mueven las issues cerradas).
2. **El tablero estuvo 5 meses sin usarse de verdad.** Las 16 issues originales (marzo 2026: `Diseño-001`, `Base_de_datos-001/002/003`, `Cuestionario_Vocacional-001/002/003`, `Autenticacion-001/002`, `UI_UX-001/002`, `Notificaciones-001/002`, `Admin_Panel-001/002/003`) describían trabajo que terminó implementándose igual, pero por commits directos a `main` sin pasar por el tablero — nunca se movieron de `Backlog`. Se cerraron el 26 ago 2026 con una nota explicando esto (no se marcaron como completadas a través del flujo normal, para no simular un uso que no existió). El tablero se reinicia desde esa fecha con 5 issues nuevas que sí reflejan trabajo pendiente real, repartidas por persona — ver `docs/auditoria_sustentacion.md`.

La sección de abajo (columnas, automatizaciones, labels) sigue siendo la referencia de **cómo se pretende usar el tablero de acá en adelante** — solo hay que ajustar mentalmente `Done` → `Ready` al leerla.

## Estructura del Tablero

### Columnas

#### 1. Backlog

**Propósito:** Almacenar todas las tareas pendientes que aún no están en desarrollo.

**Contenido:**

- Issues nuevos
- Features planificadas
- Bugs reportados pero no priorizados
- Mejoras futuras

**Criterio de entrada:**

- Issue creado y etiquetado
- Descripción clara del trabajo requerido

---

#### 2. In Progress

**Propósito:** Tareas actualmente en desarrollo.

**Contenido:**

- Issues asignados a desarrolladores
- Trabajo activo en curso
- Límite recomendado: 3 tareas por desarrollador

**Criterio de entrada:**

- Issue asignado a un desarrollador
- Desarrollador ha comenzado el trabajo

**Automatización:**

- Issues se mueven automáticamente cuando se asignan

---

#### 3. In Review

**Propósito:** Tareas completadas esperando revisión.

**Contenido:**

- Pull requests abiertos
- Código esperando code review
- Features esperando testing

**Criterio de entrada:**

- Pull request creado y vinculado al issue
- Desarrollador considera el trabajo completo

**Criterio de salida:**

- Code review aprobado
- Tests pasando
- Sin conflictos de merge

---

#### 4. Done

**Propósito:** Tareas completadas y mergeadas.

**Contenido:**

- Pull requests mergeados
- Issues cerrados
- Features desplegadas

**Criterio de entrada:**

- Pull request mergeado a main/develop
- Issue cerrado
- Feature verificada en ambiente correspondiente

---

## Automatizaciones Configuradas

### Auto-add Issues

- **Trigger:** Creación de nuevo issue
- **Acción:** Agregar automáticamente al proyecto en columna Backlog

### Auto-move on Assignment

- **Trigger:** Issue asignado a desarrollador
- **Acción:** Mover a columna In Progress

### Auto-move on PR Creation

- **Trigger:** Pull request creado y vinculado a issue
- **Acción:** Mover a columna In Review

### Auto-move on PR Merge

- **Trigger:** Pull request mergeado
- **Acción:** Mover a columna Done y cerrar issue

---

## Workflow de Desarrollo

### 1. Planificación

```
Crear issue → Etiquetar → Priorizar → Backlog
```

### 2. Inicio de Desarrollo

```
Asignar issue → Auto-move a In Progress → Crear branch
```

### 3. Desarrollo

```
Commits → Push → Tests locales
```

### 4. Revisión

```
Crear PR → Auto-move a In Review → Code review → Ajustes
```

### 5. Completado

```
Aprobar PR → Merge → Auto-move a Done → Cerrar issue
```

---

## Etiquetas (Labels)

### Por Tipo

- `feature` - Nueva funcionalidad
- `bug` - Error a corregir
- `documentation` - Mejoras en documentación
- `refactor` - Refactorización de código

### Por Prioridad

- `priority: high` - Crítico para MVP
- `priority: medium` - Importante pero no bloqueante
- `priority: low` - Mejora futura

### Por Módulo

- `backend` - Trabajo en backend
- `frontend` - Trabajo en frontend
- `database` - Cambios en base de datos
- `devops` - Infraestructura y deploy

### Por Estado

- `blocked` - Bloqueado por dependencia
- `needs-review` - Requiere revisión adicional
- `wip` - Work in progress

---

## Mejores Prácticas

### Issues

- ✅ Título claro y descriptivo
- ✅ Descripción detallada del problema/feature
- ✅ Criterios de aceptación definidos
- ✅ Etiquetas apropiadas
- ✅ Vinculación a milestone si aplica

### Pull Requests

- ✅ Título descriptivo
- ✅ Descripción de cambios realizados
- ✅ Vinculación a issue(s) relacionado(s)
- ✅ Tests incluidos
- ✅ Screenshots si hay cambios visuales

### Code Review

- ✅ Revisar en máximo 24 horas
- ✅ Comentarios constructivos
- ✅ Aprobar solo si cumple criterios de calidad
- ✅ Verificar que tests pasen

---

## Métricas de Seguimiento

### Velocity

- Issues completados por semana
- Tiempo promedio en cada columna

### Quality

- Bugs encontrados en review
- Bugs en producción
- Cobertura de tests

### Efficiency

- Tiempo de cycle (Backlog → Done)
- Tiempo de review (In Review)
- Tasa de re-trabajo

---

[← Volver al inicio](00_START_HERE.md)
