// Catálogo de personalización de Broti (la mascota perezoso de Brota).
//
// `fondo` — fotos reales, cubren el círculo completo, detrás de la
// mascota. `variante` — imágenes completas alternativas de Broti; reemplazan
// el `logo-feliz.svg` de base, no se combinan piezas sueltas como se probó
// antes con lentes/accesorio — ver CLAUDE.md sección "Broti" para el
// historial. `fondo` y `variante` sí se combinan entre sí (uno detrás,
// el otro encima).
//
// Dos formas de sumar una variante nueva:
//   1. Animal distinto (panda, zorro): PNG generado aparte con IA, mismo
//      estilo de trazo grueso oscuro — ver CLAUDE.md para el proceso completo
//      de recorte/fondo transparente.
//   2. Paleta distinta del MISMO Broti (ej. lentes-rojos/lentes-azules,
//      agosto 2026): `logo-feliz.svg` es vectorial con cada pieza en su
//      propio `<path id="...">` y color explícito — clonar el SVG y
//      recolorear el `fill` de la pieza deseada (ej. `id="lentes-marco"`)
//      alcanza, sin depender de IA externa ni de recorte de fondo (el SVG
//      base ya es transparente).

export const CATEGORIAS = [
  { key: 'variante', nombre: 'Variante', icono: '🦥' },
  { key: 'fondo', nombre: 'Fondo', icono: '🖼️' },
];

export const ITEMS = [
  { id: 'variante-panda', categoria: 'variante', nombre: 'Panda', imagen: '/broti/variantes/panda.png', swatch: '🐼', color: '#EFEAE0', gratis: true },
  { id: 'variante-zorro', categoria: 'variante', nombre: 'Zorro', imagen: '/broti/variantes/zorro.png', swatch: '🦊', color: '#FBE0C7', gratis: false },
  { id: 'variante-lentes-rojos', categoria: 'variante', nombre: 'Broti lentes rojos', imagen: '/broti/variantes/oso-lentes-rojos.svg', swatch: '🐻', color: '#FBD5D5', gratis: true },
  { id: 'variante-lentes-azules', categoria: 'variante', nombre: 'Broti lentes azules', imagen: '/broti/variantes/oso-lentes-azules.svg', swatch: '🐻', color: '#D6E4FB', gratis: true },

  { id: 'fondo-cielo', categoria: 'fondo', nombre: 'Cielo con arcoíris', imagen: '/broti/fondos/cielo-arcoiris.jpg', swatch: '🌈', color: '#DCEEFB', gratis: true },
  { id: 'fondo-bosque', categoria: 'fondo', nombre: 'Bosque encantado', imagen: '/broti/fondos/bosque-encantado.jpg', swatch: '🌲', color: 'var(--primary-soft)', gratis: true },
  { id: 'fondo-oceano', categoria: 'fondo', nombre: 'Arrecife submarino', imagen: '/broti/fondos/oceano.jpg', swatch: '🐠', color: '#D3EFFB', gratis: false },
  { id: 'fondo-desierto', categoria: 'fondo', nombre: 'Desierto al atardecer', imagen: '/broti/fondos/desierto.jpg', swatch: '🌵', color: 'var(--accent-soft)', gratis: false },
  { id: 'fondo-ciudad', categoria: 'fondo', nombre: 'Ciudad de noche', imagen: '/broti/fondos/ciudad-noche.jpg', swatch: '🌃', color: '#E4D9FA', gratis: false },
  { id: 'fondo-espacio', categoria: 'fondo', nombre: 'Espacio', imagen: '/broti/fondos/espacio.jpg', swatch: '🌌', color: '#E4E1FA', gratis: false },
];

// Imagen base de la mascota (logo-feliz.svg) si no hay variante equipada.
export const MASCOTA_BASE = '/logos/logo-feliz.svg';

export function getItem(id) {
  return ITEMS.find(i => i.id === id) ?? null;
}

export function getItemsPorCategoria(categoria) {
  return ITEMS.filter(i => i.categoria === categoria);
}

// Fondo de un badge/thumbnail para un item: si no tiene `imagen`, cae al
// swatch+color. `fondo` la usa a pantalla completa (`cover`, son fotos
// pensadas para llenar el círculo).
export function getBadgeBackground(item) {
  if (!item) return 'var(--surface-2)';
  if (!item.imagen) return item.color;
  return `url(${item.imagen}) center / cover`;
}
