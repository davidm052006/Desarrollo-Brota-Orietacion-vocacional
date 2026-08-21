// Familia de color por área académica (14 claves, alineadas con Profesiones.jsx,
// TestResult.jsx y Rutas.jsx) — Brota solo usa dos familias de color para
// clasificar programas: verde primario y naranja acento (ver CATEGORIAS en
// Profesiones.jsx). Este archivo es la única fuente de esa asignación para no
// sumar una quinta copia de la taxonomía de áreas.
export const AREA_FAMILIA = {
  tecnologia:     'primary',
  salud:          'primary',
  ciencias:       'primary',
  diseño:         'accent',
  arte:           'accent',
  educacion:      'primary',
  social:         'primary',
  comunicacion:   'accent',
  juridico:       'accent',
  negocios:       'accent',
  administrativo: 'accent',
  humanidades:    'accent',
  ambiental:      'primary',
  deporte:        'primary',
};

// Labels cortos para ejes de gráficas (radar/barras) — mismas 14 claves.
export const AREA_LABEL = {
  tecnologia:     'Tecnología',
  salud:          'Salud',
  ciencias:       'Ciencias',
  diseño:         'Diseño',
  arte:           'Arte',
  educacion:      'Educación',
  social:         'Social',
  comunicacion:   'Comunicación',
  juridico:       'Derecho',
  negocios:       'Negocios',
  administrativo: 'Administración',
  humanidades:    'Humanidades',
  ambiental:      'Ambiental',
  deporte:        'Deportes',
};

// Mismo alias que backend/src/utils/algoritmoRecomendacion.js y Rutas.jsx —
// el cuestionario usa un par de claves que no coinciden con area_academica.
const CATEGORIA_ALIAS = { emprendimiento: 'negocios', ambiente: 'ambiental' };
export function normalizarCategoria(c) {
  return CATEGORIA_ALIAS[c] ?? c;
}

export function getAreaFamilia(area) {
  const clave = normalizarCategoria(area?.toLowerCase?.() ?? area);
  return AREA_FAMILIA[clave] ?? 'primary';
}

// Lee el valor real (hex) de una custom property de marca ya resuelta por el
// navegador — respeta claro/oscuro automáticamente sin recalcular nada acá.
// Se usa para colores de Chart.js: <canvas> no siempre resuelve var(--x) de
// forma confiable como lo hace el resto del DOM.
export function getCssVar(name, fallback = '#21BD68') {
  if (typeof window === 'undefined') return fallback;
  const valor = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return valor || fallback;
}

// { line, fill, familia } listos para un dataset de Chart.js (Radar/Bar) o
// para texto/borde sobre el fill — misma pareja tint/color que usa
// Profesiones.jsx para las 14 categorías (--primary-deep sobre --primary-soft,
// --accent sobre --accent-soft), así que el contraste ya está probado en
// producción, no es una combinación nueva.
export function getAreaChartColor(area) {
  const familia = getAreaFamilia(area);
  const line = familia === 'accent' ? getCssVar('--accent', '#E07A42') : getCssVar('--primary-deep', '#0E7D43');
  const fill = familia === 'accent' ? getCssVar('--accent-soft', '#FBE8DC') : getCssVar('--primary-soft', '#E2F6EC');
  return { line, fill, familia };
}
