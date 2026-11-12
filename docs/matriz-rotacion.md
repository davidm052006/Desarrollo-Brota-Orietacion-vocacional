# Matriz de rotación — Semana 1

Completar una fila por integrante. En esta semana, todos participan en la capa
E2E; cada persona debe tomar un flujo distinto y subir su propio commit.

| Integrante | Flujo E2E asignado | S1 |
|---|---|---|
| Eduard | Inicio de sesión exitoso | E2E |
| Brayan | Inicio de sesión con contraseña incorrecta muestra error | E2E |
| Julian | Registro valida campos obligatorios vacíos | E2E |
| David | Login vacío muestra validaciones de correo y contraseña | E2E |

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
