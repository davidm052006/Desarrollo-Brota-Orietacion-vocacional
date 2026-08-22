// Catálogo de personalización de Broti (la mascota perezoso de Brota).
//
// Por ahora solo hay categoría `fondo` (fotos reales, cubren el círculo
// completo). `lentes`/`accesorio` (fusionados dentro del propio SVG del
// mascota) se probaron y se sacaron — la fusión de piezas sueltas nunca
// terminó de verse bien y el plan cambió: en vez de piezas combinables,
// van a ser "variantes" de Broti ya armadas como imagen completa (el
// usuario las prepara aparte y las pasa listas). Cuando lleguen, agregar
// una categoría `variante` acá con sus items — el resto del sistema
// (fondo como capa aparte) se mantiene igual.

export const CATEGORIAS = [
  { key: 'fondo', nombre: 'Fondo', icono: '🖼️' },
];

export const ITEMS = [
  { id: 'fondo-cielo', categoria: 'fondo', nombre: 'Cielo con arcoíris', imagen: '/broti/fondos/cielo-arcoiris.jpg', swatch: '🌈', color: '#DCEEFB', gratis: true },
  { id: 'fondo-bosque', categoria: 'fondo', nombre: 'Bosque encantado', imagen: '/broti/fondos/bosque-encantado.jpg', swatch: '🌲', color: 'var(--primary-soft)', gratis: true },
  { id: 'fondo-oceano', categoria: 'fondo', nombre: 'Arrecife submarino', imagen: '/broti/fondos/oceano.jpg', swatch: '🐠', color: '#D3EFFB', gratis: false },
  { id: 'fondo-desierto', categoria: 'fondo', nombre: 'Desierto al atardecer', imagen: '/broti/fondos/desierto.jpg', swatch: '🌵', color: 'var(--accent-soft)', gratis: false },
  { id: 'fondo-ciudad', categoria: 'fondo', nombre: 'Ciudad de noche', imagen: '/broti/fondos/ciudad-noche.jpg', swatch: '🌃', color: '#E4D9FA', gratis: false },
  { id: 'fondo-espacio', categoria: 'fondo', nombre: 'Espacio', imagen: '/broti/fondos/espacio.jpg', swatch: '🌌', color: '#E4E1FA', gratis: false },
];

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
