# Handoff: Comunidad — 6 vistas de detalle (BROTA)

## Overview
Este paquete contiene **únicamente las 6 vistas de detalle de la sección Comunidad** de BROTA (plataforma colombiana gratuita de orientación vocacional). El resto del sistema (landing, navbar, login, dashboard, etc.) **ya está implementado**; aquí solo van los detalles/modales a los que navegan las acciones de Comunidad:

1. Modal — Compartir historia
2. Modal — Hacer una pregunta
3. Vista — Foro interior
4. Vista — Historia completa
5. Vista — Convocatoria detalle
6. Vista — Post de foro con respuestas

## About the Design Files
El archivo `BROTA Comunidad Vistas.dc.html` es una **referencia de diseño en HTML** — prototipo que muestra apariencia y contenido, **no código de producción para copiar tal cual**. La tarea es **recrear estas vistas en el entorno real del proyecto** usando sus patrones, componentes y librerías existentes.

> Nota técnica: el `.dc.html` usa un runtime propio (`support.js`). Para abrirlo como referencia debe servirse desde un servidor local (no `file://`). Las 6 vistas están maquetadas juntas en un solo lienzo, separadas por sus títulos ("1 · Modal — …", etc.).

## Fidelity
**Alta fidelidad (hi-fi).** Colores, tipografía, espaciado y estados son definitivos.

---

## Design Tokens (marca oficial — modo claro)
Estas vistas ya están en la marca oficial. Implementar con CSS custom properties.

```
--bg:          #F4F3EC   (fondo de la vista)
--surface:     #FFFFFF   (cards / paneles)
--surface-2:   #EFEEE5   (inputs, textareas, chips neutros, toggles off)
--ink:         #15241B   (texto principal)
--ink-soft:    #67756B   (texto secundario / labels)
--line:        #E6E4DA   (bordes y divisores)
--primary:     #21BD68   (verde brota — acción principal)
--primary-deep:#0E7D43   (verde oscuro — flechas de voto, acentos)
--primary-ink: #FFFFFF   (texto sobre primary)
--primary-soft:#E2F6EC   (fondos verdes suaves, chips, badges)
--primary-glow:rgba(33,189,104,.28)  (sombra/glow de botones verdes)
--accent:      #E07A42   (coral — acento cálido, reacciones)
--accent-soft: #FBE8DC   (fondos coral suaves)
--shadow:      0 4px 18px rgba(20,40,28,.06)
```

### Tipografía
- **Titulares / display:** `Bricolage Grotesque`, weight 800 (títulos), 700 (subtítulos de card). letter-spacing negativo (-0.4px a -0.6px) en tamaños grandes.
- **Cuerpo / UI:** `Plus Jakarta Sans`, weights 400/500/600/700/800.
- Escala: título de modal 22px · título de vista 23–28px · título de card 14–17px · cuerpo 13.5–14.5px (line-height 1.6–1.75) · meta/labels 11–12px.

### Radios, sombras, botones
- Border-radius: cards 14–20px · modales 20px · botones/pills/chips 999px · inputs/textareas 11–12px · iconos cuadrados 16px.
- Botón primario: fondo `--primary`, texto `--primary-ink`, padding ~14px (full pill), sombra `0 8px 20px var(--primary-glow)`.
- Modal: card blanca radius 20px, sombra `0 24px 60px rgba(0,0,0,.25)`, sobre backdrop `rgba(15,31,20,.32)`.

### Chips de Área (compartidos por modales 1 y 2)
Etiquetas: Tecnología · Salud · Negocios · Artes · Educación · Ambiente.
- Base: `font-size:12.5px; padding:7px 14px; border-radius:999px; border:1px solid var(--line);`
- **Activo:** `background:var(--primary); color:#fff; font-weight:700;`
- **Inactivo:** `background:var(--surface); color:var(--ink-soft); font-weight:600;`

---

## Las 6 vistas

### 1. Modal — Compartir historia
- **Disparador:** botón "+ Compartir tu historia" en el tab *Historias reales*.
- **Layout:** card centrada (~620px) sobre backdrop oscurecido. Header: título "Comparte tu historia 🌱" (Bricolage 22px) + subtítulo "Tu experiencia puede orientar a alguien que viene detrás." + botón cerrar ✕ (círculo 34px, fondo `--surface-2`).
- **Campos (en orden):**
  - Label "Título" + input (placeholder "¿Cómo fue tu camino?", fondo `--surface-2`, borde `--line`).
  - Label "Área" + fila de chips de área (uno activo, p.ej. *Artes*).
  - Label "Tu historia" + textarea alto ~120px (placeholder largo de guía).
  - Toggle row "Publicar como anónimo / Tu nombre no será visible." con switch **activado** (verde, círculo a la derecha).
  - Botón pill full-width "Enviar historia".
  - Nota de moderación centrada: "🛡️ Tu historia pasa por revisión antes de publicarse." (11.5px, `--ink-soft`).

### 2. Modal — Hacer una pregunta
- **Disparador:** botón "Preguntar" en el tab *Preguntas*.
- **Layout:** card más angosta (~560px), mismo estilo de modal. Header: "Hazle una pregunta a la comunidad" + subtítulo "Miles de estudiantes pasaron por lo mismo."
- **Campos:**
  - Label "Tu pregunta" + textarea ~64px (placeholder "¿Qué quieres saber?").
  - Label "Área" + chips de área (uno activo, p.ej. *Tecnología*).
  - Toggle "Publicar como anónimo / Pregunta sin mostrar tu nombre." con switch **desactivado** (gris, círculo a la izquierda).
  - Botón pill full-width "Preguntar".
  - Nota: "⚡ La comunidad responde en menos de 24h."

### 3. Vista — Foro interior
- **Disparador:** "Entrar →" en una tarjeta de foro (tab *Foros*).
- **Layout:** página ancha (~1180px) fondo `--bg`.
  - Breadcrumb "← Comunidad · Foros".
  - **Header de foro:** icono cuadrado del área (58px, fondo `--primary-soft`, emoji 💻) + título "Tecnología e informática" (Bricolage 25px) + meta "128 posts activos · 1.204 estudiantes siguiendo" + botón pill "+ Nuevo post" a la derecha.
  - **Sub-tabs:** "Recientes" (activo, underline verde 2.5px) · "Más votados".
  - **Lista de posts** (cards `--surface`, borde `--line`, radius 14px): a la izquierda control de voto (▲ verde + número en negrita); a la derecha: fila autor (avatar circular con inicial sobre color, nombre, "· tiempo"), título (Bricolage 17px), preview 1–2 líneas, y fila de chips ("▲ N votos" en verde suave, "💬 N respuestas" en gris).
- **Hover de card:** elevar con borde `--primary` + sombra glow.

### 4. Vista — Historia completa
- **Disparador:** "Leer historia →" en una card de historia.
- **Layout:** ancho de lectura ~720px centrado, fondo `--bg`.
  - Breadcrumb "← Volver a historias".
  - **Cabecera de autor:** avatar 56px (inicial sobre color), nombre + "carrera · institución", chip de área a la derecha ("🎨 Artes").
  - **Título** Bricolage 28px (line-height 1.15).
  - **Cuerpo:** párrafos, font 14.5px, line-height 1.75, color `--ink`.
  - **Barra de reacción:** pill coral "❤️ 214 · ¿Te identificas?" (`--accent-soft`/`--accent`) + "Publicado hace 2 días".
  - Divisor.
  - **"¿Te pasó algo similar?":** título Bricolage 18px + grid 2 columnas de cards relacionadas (avatar+nombre, título, "❤️ N · Leer →").

### 5. Vista — Convocatoria detalle
- **Disparador:** "Ver más →" en una convocatoria (tab *Convocatorias*).
- **Layout:** ancho ~720px, fondo `--bg`.
  - Breadcrumb "← Volver a convocatorias".
  - **Badges:** tipo "Beca" (verde, `#dcfce7`/`#16A34A`, uppercase) + urgencia "⏳ Cierra en 4 días" (coral/rojo).
  - **Título** Bricolage 27px.
  - **Meta:** "🏛️ ICETEX · 📍 Nacional · 📅 Cierra 30 jun 2026".
  - **Sección "Requisitos":** lista con check ✓ verde + texto (font 13.5px, line-height 1.5).
  - **Sección "Cómo aplicar":** pasos numerados en círculos verdes (`--primary-soft`/`--primary-deep`, 26px) + texto.
  - **CTAs:** pill primario "Ir al sitio oficial →" + pill secundario "← Volver" (fondo `--surface`, borde `--line`).

### 6. Vista — Post de foro con respuestas
- **Disparador:** abrir un post desde el foro interior.
- **Layout:** ancho de lectura ~760px, fondo `--bg`.
  - Breadcrumb "← Tecnología e informática".
  - **Post original:** control de voto vertical ▲ / número / ▼; a la derecha autor (avatar 36px, nombre, "· tiempo"), título Bricolage 23px, cuerpo 14.5px (line-height 1.7).
  - Divisor + "3 respuestas".
  - **Lista de respuestas:** cada una con voto (▲ + número) y card `--surface`: fila autor (avatar, nombre, tiempo) — en la destacada, badge a la derecha "★ Mejor respuesta" (`--primary-soft`/`--primary-deep`); texto de respuesta; acción "↳ Responder".
  - **Composer "Tu respuesta":** card con textarea ~70px + botón pill "Publicar" alineado a la derecha.

---

## Interactions & Behavior
- **Modales (1, 2):** abren sobre backdrop semitransparente; ✕ y click en backdrop cierran; al enviar → estado de éxito/toast (a definir con el código existente) y, en historia, mensaje de "pasa por revisión".
- **Toggle anónimo:** switch que alterna nombre real / "Anónimo" en el post resultante.
- **Selector de área (chips):** selección única; el activo en verde.
- **Voto (vistas 3 y 6):** ▲/▼ incrementa/decrementa el contador; estado votado en verde.
- **Mejor respuesta (vista 6):** el autor del post puede marcar una respuesta como "★ Mejor respuesta".
- **Navegación:** los breadcrumbs "←" regresan a la pantalla de listado correspondiente.
- **Hover:** cards de post elevan con borde `--primary` + sombra `--primary-glow`; botones primarios oscurecen a `--primary-deep`.

## State Management
- Modal compartir historia: `{ titulo, area, historia, anonimo }`.
- Modal pregunta: `{ pregunta, area, anonimo }`.
- Foro interior: `orden: 'recientes' | 'votados'`, lista de posts.
- Post con respuestas: `votos`, `respuestas[]`, `mejorRespuestaId`.
- Historia / Convocatoria: detalle traído por id + relacionados.

## Files
- `BROTA Comunidad Vistas.dc.html` — las 6 vistas maquetadas (referencia visual).
- `support.js` — runtime para abrir el `.dc.html` como referencia.
