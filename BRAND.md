# Manual de Marca — Brota

> Documento de referencia para diseño, desarrollo y comunicación. Cualquier nuevo componente, pantalla o material debe respetar estas guías.

---

## 1. Identidad

**Nombre:** Brota  
**Dominio conceptual:** "Brotar" — crecer, germinar, surgir. La metáfora del crecimiento personal atraviesa toda la marca: el estudiante llega sin saber quién es y sale con un camino claro.

**Tagline principal:** *"Descubre quién quieres ser."*  
**Tagline alternativo (CTA):** *"Tu futuro empieza con Brota."*  
**Descripción en una línea:** Plataforma colombiana de orientación vocacional gratuita para estudiantes que quieren elegir carrera con confianza, no con miedo.

### Misión
Que ningún estudiante colombiano tome una decisión vocacional sin orientación. Brota democratiza el acceso a herramientas de autoconocimiento y a información real de programas educativos.

### Valores de marca
| Valor | Qué significa en Brota |
|---|---|
| **Accesibilidad** | Gratis para estudiantes. Siempre. |
| **Ciencia** | El test vocacional se basa en teorías de orientación reconocidas internacionalmente |
| **Honestidad** | No hay "carrera perfecta" — hay afinidad real con quién eres hoy |
| **Crecimiento** | La plataforma acompaña, no define. Hay espacio para cambiar y descubrirse |
| **Localidad** | Datos reales del MEN, SENA y universidades colombianas |

---

## 2. Logo

**Archivo:** `frontend/public/logo-brota.png`  
**Uso en código:** `<img src="/logo-brota.png" alt="Brota" className="h-9 w-auto" />`

### Reglas de uso
- Sobre fondo claro: logo en su versión original (verde sobre blanco/crema)
- Sobre fondo oscuro o verde: logo en versión clara (blanco/crema)
- Tamaño mínimo: 28px de alto (`h-7`) en navbar compacto; 36px (`h-9`) en contextos normales
- No distorsionar proporciones — usar siempre `w-auto`
- No agregar efectos (sombra, rotación, filtros) sin aprobación

---

## 3. Paleta de colores

> ⚠️ Corregido agosto 2026: esta sección describía una paleta Tailwind (`green-50`…`green-950`, tokens `--color-*`) que ya no existe en el código — quedó desactualizada desde el rediseño de junio 2026. Lo de abajo son los tokens reales definidos en `frontend/src/index.css` (verificado contra el archivo, no contra memoria).

### Tokens de marca (custom properties en `:root` / `html.dark`)

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--bg` | `#F4F3EC` (crema/off-white) | `#0C1310` | Fondo general de toda la app — **no** es blanco puro |
| `--surface` | `#FFFFFF` | `#151F19` | Cards, modales, navbar |
| `--surface-2` | `#EFEEE5` | `#1C2A22` | Fondos secundarios dentro de una surface |
| `--ink` | `#15241B` | `#EAF3EC` | Texto principal |
| `--ink-soft` | `#67756B` | `#94A69B` | Texto secundario/labels |
| `--line` | `#E6E4DA` | `#27362D` | Bordes y separadores |
| `--primary` | `#21BD68` | `#34D27D` | Verde principal — CTAs, íconos activos, acentos |
| `--primary-deep` | `#0E7D43` | `#1FA862` | Hover / variante oscura del primario |
| `--primary-ink` | `#FFFFFF` | `#04301C` | Texto sobre fondo `--primary` |
| `--primary-soft` | `#E2F6EC` | `#16301F` | Fondos sutiles con tinte primario (badges, chips) |
| `--primary-glow` | `rgba(33,189,104,.28)` | `rgba(52,210,125,.22)` | Sombras/glow alrededor de elementos primarios |
| `--accent` | `#E07A42` (naranja) | `#F0996A` | Segundo color de acento, uso puntual |
| `--accent-soft` | `#FBE8DC` | `#2C2018` | Fondos sutiles con tinte de acento |

El modo oscuro se activa con la clase `html.dark` (`hooks/useDarkMode.js`) — cada token cambia de valor, no hay que recalcular nada a mano en los componentes, solo usar `var(--token)`.

### Reglas de color
- **Nunca** usar el verde primario como fondo de texto largo — solo para acentos, botones e íconos.
- El fondo base (`--bg`) es un crema cálido, no blanco — si un componente nuevo usa `#fff`/`white` a mano en vez de `var(--surface)` o `var(--bg)`, se va a ver desalineado del resto de la app en modo claro (y directamente roto en modo oscuro).
- Todo color debe salir de estos tokens vía `var(--token)`, no hardcodear hex nuevos — así el dark mode funciona gratis en cualquier componente nuevo.

---

## 4. Tipografía

- **Familia:** Tailwind CSS default system stack (Inter, SF Pro, Segoe UI, sans-serif)
- **Escala aplicada en la app:**

| Uso | Clase Tailwind | Peso |
|---|---|---|
| Headline principal (landing H1) | `text-5xl` / `text-7xl` | `font-bold` |
| Títulos de sección (H2) | `text-3xl` / `text-4xl` | `font-bold` |
| Subtítulos de card | `text-lg` / `text-xl` | `font-semibold` |
| Cuerpo | `text-base` | `font-normal` |
| Labels / meta | `text-sm` / `text-xs` | `font-medium` |
| Nombre "BROTA" en navbar | `text-xl` | `font-bold tracking-wide` |

### Énfasis
El headline usa `<em className="not-italic text-green-600">` para destacar palabras clave sin cursiva — patrón a mantener en titles grandes.

---

## 5. Voz y tono

| Dimensión | Guía |
|---|---|
| **Persona** | Segunda persona singular: "tú", "tu camino", "tus intereses" |
| **Tono** | Cercano, honesto, alentador — nunca condescendiente ni corporativo |
| **Verbos de acción** | Descubre, Explora, Encuentra, Empieza, Crece |
| **Evitar** | Jerga técnica, frases genéricas ("la mejor plataforma"), presión o urgencia falsa |
| **Mensaje central** | No hay respuesta incorrecta. No hay camino equivocado. Hay el tuyo. |

### Ejemplos de copy por pantalla
- **Dashboard saludo:** *"¡Hola, {nombre}! 🌱"*
- **Login (volver):** *"Tu camino sigue justo donde lo dejaste."*
- **Registro (nuevo):** *"Crea tu cuenta y empieza a crecer."*
- **CTA principal:** *"Empezar gratis"*
- **CTA secundario:** *"Saber más"*

---

## 6. Iconografía y emojis

- **Emoji de marca:** 🌱 (brote verde) — aparece en saludo del dashboard y en comunicaciones informales
- **Íconos UI:** Heroicons o similares (trazo limpio, sin relleno en estado normal)
- Los emojis solo en contextos conversacionales/informales (saludo, notificaciones); **no** en botones de acción ni en labels de formulario

---

## 7. Componentes clave de UI

> ⚠️ Corregido agosto 2026: los snippets de abajo (con clases Tailwind `bg-green-*` fijas) eran del sistema pre-rediseño. **Conviven hoy dos convenciones reales en el código, no una sola** — importa saber cuál tocar según qué archivo se está editando:

- **La mayoría de `pages/dashboard/*.jsx`** (Dashboard, Racha, Rutas, Ajustes, Notificaciones, Comunidad, TestVocacional…) usa **`style={{}}` inline con `var(--token)`** — ver ejemplo real abajo. Se adapta a dark mode automático (los tokens cambian de valor con la clase `html.dark`, no hay que escribir nada extra).
- **`pages/dashboard/admin/sections/*.jsx` y `pages/landing/*.jsx`** todavía usan **clases de Tailwind con verdes hardcodeados y variantes `dark:` manuales** (`bg-green-600 dark:bg-green-900/50`, etc.) — no leen los tokens de `index.css`. Es deuda de migración, no un patrón a copiar para código nuevo: si el `--primary` cambia de tono, estos archivos no lo reflejan automático.

**Para código nuevo: seguir el patrón de `var(--token)` inline**, no el de Tailwind con verdes fijos, aunque en el panel admin sea lo que más se vea hoy.

### Botón primario (patrón real, `var(--token)`)
```jsx
style={{
  background: 'var(--primary)', color: 'var(--primary-ink)',
  fontWeight: 800, padding: '9px 0', borderRadius: 999, border: 'none', cursor: 'pointer',
}}
```

### Superficie tenue con tinte primario (badges, chips, fondos sutiles)
```jsx
style={{ background: 'var(--primary-soft)', color: 'var(--primary-deep)' }}
```

### Card estándar
```jsx
style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20 }}
```

---

## 8. Contexto del producto

### Usuarios objetivo
- Estudiantes colombianos de bachillerato (grados 9°–11°) y recién egresados
- Rango de edad: 14–20 años
- Contexto: sin acceso a orientadores vocacionales profesionales (especialmente fuera de Bogotá)

### Flujo principal
1. **Registro** → datos básicos, edad, ciudad, nivel educativo
2. **Test vocacional** → preguntas sobre intereses, habilidades y pasiones
3. **Perfil vocacional** → resultado con áreas de mayor afinidad
4. **Recomendaciones** → programas reales de universidades y SENA según perfil
5. **Exploración** → navegar programas, filtrar por área, ciudad, institución

### Datos educativos
- Fuente: API MEN (datos.gov.co) — ~14.644 programas activos de todo el país
- Licencia: CC-BY-SA 4.0 (Ministerio de Educación Nacional)
- Instituciones: universidades públicas/privadas + SENA

### Restricciones de diseño importantes
- **TailwindCSS v4**: el oxide scanner requiere `@source` explícitos en `frontend/src/index.css` — no eliminarlos
- **Dark mode**: implementado con clase `.dark` en `<html>` (`hooks/useDarkMode.js`). En `pages/dashboard/*.jsx` (fuera del panel admin) esto es automático usando `var(--token)` — no hace falta variante `dark:` ahí. En el panel admin y landing, que siguen en Tailwind con verdes hardcodeados, sí hace falta escribir `dark:` a mano en cada clase (ver sección 7).
- **Sin sidebar**: el dashboard usa TopNavbar horizontal (no sidebar vertical)
