# Mascota Brota — perezoso con lentes

Estado del trabajo de la mascota (perezoso/sloth) para Brota, generada con Recraft AI. Este documento existe para retomar el trabajo en otra sesión sin perder el contexto.

## Referencias originales
Las imágenes en `referencias/` (`ref 1.jpeg`, `ref 2.jpeg`, `ref 3.jpeg`) son las referencias de estilo que dio el usuario (perezositos kawaii, contorno grueso, cuerpo café/crema) — reemplazaron a las 6 capturas `WhatsApp Image *.jpeg` originales. La mascota de Brota se basa en ese estilo pero solo de cara (sin cuerpo ni ramita), con lentes redondos añadidos.

## Estructura de carpetas (reorganizado agosto 2026)

```
logos/
├── referencias/    fotos de estilo que dio el usuario (input, no se edita)
├── fuente/         export crudo de Recraft, fuente de verdad — no editar directamente
├── historico/       primer intento, superado — se conserva solo de referencia
└── variantes/       archivos de trabajo activos, todos derivados de logo-base-limpio.svg
```

El logo de texto/wordmark (`logo-brota.png`, el que usa hoy el código vía `/logo-brota.png`) vive únicamente en `frontend/public/logo-brota.png` — ya no hay copia duplicada acá. Esta carpeta es solo para el trabajo en curso de la mascota.

## Inventario de archivos

| Archivo | Qué es | Estado |
|---|---|---|
| `historico/logo-base.svg` | Export crudo de Recraft, primera generación (lentes sin separar del ojo). **Superado, no usar.** | histórico |
| `fuente/lentes.svg` | Export crudo de Recraft, segunda generación — se le pidió que redibujara los lentes como pieza separada. **Fuente de verdad**, no editar directamente. | fuente, intacto |
| `variantes/logo-base-limpio.svg` | Base de trabajo actual: `lentes.svg` limpio (sin metadata C2PA ni el rect de fondo blanco) y con los 37 paths agrupados con IDs semánticos. | ✅ estable |
| `variantes/logo-guino.svg` | Variante: ojo derecho guiñando. Estructura del ojo cerrado confirmada por el usuario ("bien me gusta"); la última edición le devolvió el brillo de vidrio (ver receta final abajo) pero esa versión puntual no llegó a confirmarse en palabras antes de cerrar la sesión — revisar visualmente al retomar. | ✅ estructura correcta, ⚠️ confirmar el brillo de vidrio |
| `variantes/logo-triste.svg` | Variante: ceño fruncido + lágrima bajo el ojo izquierdo. Construida sobre `logo-base-limpio.svg`, no toca el grupo de ojos. | ✅ debería estar bien, no se re-verificó visualmente en la última tanda de fixes (solo toca nariz/boca/lágrima, no los ojos) |
| `variantes/logo-feliz.svg` | Variante nueva, no documentada hasta esta sesión. Misma estructura base que `logo-base-limpio.svg` (mismos IDs de contorno, pelaje, orejas, hoja); ambos grupos de ojos están intactos (12-13 sub-piezas cada uno, sin tocar); `boca-nariz` tiene 2 piezas extra (`boca-nariz-1`, `boca-nariz-2`) sobre la base, probablemente para una sonrisa más grande/abierta. | ⚠️ sin verificar visualmente ni confirmar con el usuario — pendiente de revisión |

Todas las variantes parten de `logo-base-limpio.svg` — si se vuelve a tocar la base, hay que reconstruir `logo-guino.svg`, `logo-triste.svg` y `logo-feliz.svg` desde la nueva versión (no son independientes).

## Estructura interna de `logo-base-limpio.svg`

viewBox `0 0 1024 1024`, sin fondo (transparente). IDs principales:

- `contorno-base` — silueta cabeza+orejas
- `cabeza-pelaje` — relleno café del pelaje
- `mascara-contorno` — silueta de la máscara facial crema
- `lentes-marco` — **el armazón real de las gafas** (extraído de `lentes.svg`, el único elemento que Recraft generó como pieza separada tras pedírselo explícitamente). `fill="none" stroke="#16A34A" stroke-width="18"`. Es un solo `<path>` con las dos lentes + el puente en un trazo continuo.
- `<g id="ojo-derecho">` / `<g id="ojo-izquierdo">` — 12-13 sub-piezas cada uno (ver tabla abajo). El sufijo numérico es solo orden de aparición, no tiene significado propio.
- `<g id="boca-nariz">` — nariz + línea de sonrisa
- `mascara-superior` — máscara facial, mitad superior
- `<g id="orejas">` — sombra interior + pelaje exterior de cada oreja
- `hoja` — brote verde en la cabeza (acento de marca)

### Anatomía de cada ojo (importante para futuras expresiones)

Cada ojo son 12-13 paths superpuestos dentro de un círculo (el "lente"). De adentro hacia afuera / por capas:

1. **Base del lente**: un disco oscuro (`#360E0A`, ligeramente más grande) + un disco claro encima (`#FFFEFE`, "vidrio"). Juntos casi llenan el círculo del marco.
2. **El ojo real**: dentro de esa base hay un cluster PEQUEÑO y separado — contorno + esclerótica blanca + iris gris + pupila negra — centrado en **la posición real del ojo, que NO coincide con el centro geométrico del aro**. El aro/lente tiene su centro en `y≈541`; el ojo real vive en `y≈568` (unas 27-30 unidades más abajo). Este desfase fue la causa del bug "el ojo del guiño quedó muy arriba".
3. **Medialunas de sombra/brillo** (`#937566`, `#C79570`, etc.) — decoran el "vidrio", dan sensación de reflejo. Si se dejan sueltas (sin el cluster de pupila en medio) casi cierran un círculo completo por sí solas → se lee como "un segundo ojo fantasma". Esto causó dos rondas de bugs.

**Receta final que quedó confirmada para "cerrar" un ojo (usada en el guiño derecho)**, de las 12 piezas de `ojo-derecho`:

- **Conservar**: `ojo-derecho-1` (disco oscuro base), `ojo-derecho-2` (disco blanco "vidrio"), `ojo-derecho-10` (el brillo diagonal de vidrio, único, no forma anillo).
- **Borrar**: `ojo-derecho-3,4,5,11,12` (las medialunas de sombra — casi cierran un círculo completo entre todas y se leen como "un segundo ojo fantasma") y `ojo-derecho-6,7,8,9` (el cluster del ojo real: contorno+esclerótica+iris+pupila).
- **Agregar**: una sola línea de guiño (`stroke`, sin relleno) centrada en la posición real del ojo, no en el centro del aro (ver geometría abajo). **No** agregarle una segunda curva de "sombra" detrás — por sutil que se vea en el render, se lee como un guiño fantasma duplicado. Tampoco hace falta un círculo nuevo tapando todo: dejar `ojo-derecho-1`/`-2` como están ya cubre el área correctamente.

Intentos que NO funcionaron (para no repetirlos): (a) tapar todo con un círculo nuevo encima → crea doble círculo visible porque el disco blanco original sigue ahí debajo; (b) dejar las medialunas de sombra sueltas sin el cluster de pupila en medio → arman el aro fantasma; (c) agregar una curva de sombra detrás de la línea de guiño → se lee como un segundo guiño.

**Sobre discrepancias "yo lo veo bien, el usuario lo ve mal"**: cuando esto pasa, no sigas iterando a ciegas sobre hipótesis — arma un artifact HTML que inserte el `<svg>` real (no una captura PNG) para que ambos vean exactamente el mismo render en el navegador. Elimina de raíz la duda de si es un problema del archivo o del visor/caché. Se usó para esta variante y ayudó a converger rápido.

### Geometría exacta (calculada con `svgpathtools`, no a ojo)

- Ojo/lente derecho: centro `(650.94, 541.03)`, radio `112.26` (línea central del trazo del marco; el marco tiene `stroke-width=18` así que el borde interior real está en radio ≈103).
- Ojo/lente izquierdo: centro `(373.16, 541.11)`, radio `112.13`.
- Posición real de la pupila (no la del centro del aro): ojo derecho ≈ `(657, 572)`, ojo izquierdo ≈ `(384, 570)`. La línea de guiño de `logo-guino.svg` usa el punto `(655, 568)` como centro.

### Paleta usada en las variantes

| Uso | Color |
|---|---|
| Marco de lentes / hoja | `#16A34A` (verde primario de marca Brota) |
| Crema de cara/máscara | `#E1CFC6` |
| Contorno oscuro / línea de guiño | `#360E0A` |
| Lágrima (triste) | relleno `#8ECFEB`, contorno `#360E0A` |

`#937566` (tono de las medialunas de "vidrio") se probó como color de sombra detrás del guiño y se descartó — ver lección arriba.

## Prompt de Recraft usado para separar los lentes

El prompt que sí funcionó (pedido en modo edición de Recraft, sobre la imagen ya generada, no un prompt de generación desde cero):

```
Keep this exact sloth face illustration unchanged — same pose, proportions,
fur color, face mask, nose, mouth, ears, and leaf. The only fix needed: redraw
the round glasses as two fully separate, independently colorable vector
shapes layered on top of the face — one closed shape for the frame/rim, and
a separate closed shape for the lens/glass area inside it — neither merged,
blended, or overlapping with the eye patches, pupils, or fur shading behind
them. Keep every other element (eyes, pupils, eye patches, nose, mouth, ears,
fur, leaf) as its own separate flat-colored closed shape too, with no merged
or overlapping paths, so each part can be selected and recolored on its own.
```

Resultado: Recraft sí separó el marco (`lentes-marco`) como un único path independiente, pero de paso agregó los detalles de "vidrio" (medialunas de sombra/brillo) que no se habían pedido — eso es lo que generó la complejidad en `ojo-derecho`/`ojo-izquierdo`.

## Herramientas instaladas en esta sesión

Para trabajar SVG con precisión en vez de estimar centros/radios mirando capturas de pantalla:

- `svgpathtools` (Python, `pip install --break-system-packages`) — parsea el atributo `d` real en curvas Bézier, da bounding boxes exactos, ajuste de círculos por mínimos cuadrados, muestreo de puntos. Se usó para calcular toda la geometría de la sección anterior.
- `svgelements` (Python) — alternativa, entiende también `<g>` y transforms anidados.
- `pillow` + `numpy` (Python) — para inspeccionar renders PNG píxel a píxel (comparar versiones, medir colores).
- Ya estaban disponibles en el sistema: `rsvg-convert` (SVG → PNG) e `imagemagick` (`magick`/`convert`, para crop/resize/comparar). **No** está instalado Inkscape (no hay CLI para operaciones booleanas reales tipo unir/restar formas — si se necesita eso, instalarlo).

## Pendiente para la próxima sesión

1. **Confirmar visualmente la última versión de `logo-guino.svg`** (la que dejó el brillo de vidrio — base blanca + `ojo-derecho-10` + línea de guiño). El usuario ya había confirmado la versión sin brillo ("bien me gusta") antes de pedir que se le devolviera el brillo; esa última edición no se alcanzó a confirmar en palabras. Hay un artifact HTML publicado en esta sesión que compara base vs guiño en vivo (url solo válida dentro de esa conversación, no reproducible acá — si hace falta volver a comparar, generar uno nuevo con el mismo método: insertar el `<svg>` real de ambos archivos en un HTML y publicarlo).
2. Si el guiño queda confirmado, aplicar la misma receta (sección "Receta final" arriba) a `logo-triste.svg` — que en principio no debería tener el mismo bug porque no toca el grupo de ojos, pero no se re-verificó visualmente tras las últimas correcciones.
3. Decidir si vale la pena regenerar más expresiones (feliz grande, sorprendido, dormido, etc.) reutilizando el mismo patrón: para cada ojo/boca que haya que "cerrar" o modificar, conservar las piezas base+brillo, borrar las medialunas de sombra + el cluster del ojo real, redibujar con geometría calculada (`svgpathtools`), nunca a ojo.
4. Pendiente de sesión anterior, sigue abierto: animar la mascota (se descartaron herramientas de IA generativa tipo Kling/Pika por distorsionar el vector; la recomendación fue CSS/SMIL directo sobre estos grupos, o Rive).
