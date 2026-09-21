# Trazabilidad de historias de usuario

## Objetivo

Este documento conecta cada historia de usuario con su issue, responsable, rama, pull request, commits, criterios de aceptación y evidencia de prueba. Se actualiza cuando una issue cambia de estado; no se usa para reconstruir ni maquillar el historial anterior.

## Identificadores

- `HU-023` corresponde a la issue `#23`; el mismo patrón se aplica a las demás historias.
- La issue es la fuente del alcance y los criterios de aceptación.
- El pull request es la fuente de revisión y aprobación.
- El commit es la evidencia de implementación.
- El resultado de prueba o enlace al despliegue es la evidencia de validación.

## Matriz de seguimiento

| ID | Issue | Historia / trabajo | Responsable | Rama | PR | Estado documentado | Evidencia de aceptación |
|---|---:|---|---|---|---:|---|---|
| HU-023 | #23 | Ampliar cobertura de pruebas | Eduard | `feature/tests-cobertura` | En curso | 43 pruebas automatizadas backend/frontend; falta medir cobertura porcentual global | Ejecutar suite y registrar porcentaje medido |
| HU-024 | #24 | CRUD real de convocatorias en administración | Julián | `feature/crud-convocatorias` | Implementada localmente | Backend y sección admin funcionales; pendiente PR | Crear, consultar, actualizar y eliminar una convocatoria persistida |
| HU-025 | #25 | Responsive y vista móvil del dashboard | Julián | `feature/responsive-dashboard` | Implementada localmente | Dashboard principal con layout de una columna hasta 900 px; pendiente PR | Verificar dashboard en viewport móvil y escritorio sin solapamientos |
| HU-026 | #26 | Endpoint de inserción masiva para CSV | Brayan | `feature/bulk-insert-csv` | Implementada | Endpoint existente validado; frontend rechaza encabezados incompletos | Procesar archivo válido, rechazar filas inválidas y devolver resumen |
| HU-027 | #27 | Guard de rol admin a nivel de ruta | David | `feature/admin-route-guard` | #28 | Cerrada según auditoría | PR revisado y vinculado a la issue |

Las ramas de las historias pendientes son nombres de trabajo acordados. Deben crearse desde `develop` y actualizarse en esta tabla cuando exista el primer commit.

## Criterio de cierre

Una historia solo pasa a `Ready` cuando cumple todos estos puntos:

- Issue con descripción, responsable y criterios de aceptación verificables.
- Rama con nombre `feature/<nombre-descriptivo>` creada desde `develop`.
- Commits pequeños y descriptivos, vinculados a la issue cuando GitHub lo permita.
- Pull request abierto con la historia relacionada y evidencia de pruebas.
- Revisión aprobada y conflictos resueltos.
- Pull request fusionado a `develop` o `main`, según la política acordada.
- Issue cerrada y fila actualizada con enlaces a PR, commits y pruebas.

## Plantilla para una historia nueva

Copiar esta estructura en la issue y completar los datos reales:

```text
ID: HU-XXX
Como [tipo de usuario], quiero [acción], para [beneficio].

Criterios de aceptación:
- [ ] ...
- [ ] ...

Responsable: @usuario
Rama: feature/nombre-descriptivo
PR: pendiente
Pruebas: comando y resultado
Despliegue o captura: enlace, si aplica
```

## Flujo de ramas y commits

```text
1. Actualizar develop
2. Crear feature/<nombre-descriptivo>
3. Implementar en commits pequeños
4. Ejecutar pruebas locales
5. Abrir PR hacia develop
6. Revisar, corregir y fusionar
7. Mover la issue a Ready y completar esta matriz
```

Convención recomendada para commits:

```text
<modulo>: <verbo en infinitivo o presente, cambio concreto>

Ejemplos:
backend: agregar endpoint de convocatorias
frontend: adaptar dashboard a viewport movil
test: cubrir validacion de insercion masiva
docs: actualizar trazabilidad de HU-024
```

## Registro de cambios de trazabilidad

| Fecha | Cambio | Responsable |
|---|---|---|
| 2026-09-21 | Se formaliza la matriz y el criterio de cierre para las issues #23 a #27 | Equipo Brota |

La distribución histórica de commits y el uso anterior del tablero se conservan en [`auditoria_sustentacion.md`](auditoria_sustentacion.md). La corrección se realiza hacia adelante mediante este flujo, sin reescribir la historia de Git.
