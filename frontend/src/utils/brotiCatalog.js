// Catálogo de personalización de Broti (la mascota perezoso de Brota).
//
// `fondo` — fotos reales, cubren el círculo completo, detrás de la
// mascota. `variante` — imágenes completas alternativas de Broti (el
// usuario las prepara aparte con IA y las pasa ya armadas; reemplazan el
// `logo-feliz.svg` de base, no se combinan piezas sueltas como se probó
// antes con lentes/accesorio — ver CLAUDE.md sección "Broti" para el
// historial). `fondo` y `variante` sí se combinan entre sí (uno detrás,
// el otro encima).

export const CATEGORIAS = [
  { key: 'variante', nombre: 'Variante', icono: '🦥' },
  { key: 'fondo', nombre: 'Fondo', icono: '🖼️' },
];

export const ITEMS = [
  { id: 'variante-panda', categoria: 'variante', nombre: 'Panda', imagen: '/broti/variantes/panda.png', swatch: '🐼', color: '#EFEAE0', gratis: true },
  { id: 'variante-zorro', categoria: 'variante', nombre: 'Zorro', imagen: '/broti/variantes/zorro.png', swatch: '🦊', color: '#FBE0C7', gratis: false },

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
