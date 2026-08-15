// Constantes y helpers puros compartidos por las pestañas de Comunidad.
// Separado de primitivos.jsx a propósito: ese archivo solo exporta
// componentes (lo exige el Fast Refresh de Vite), este exporta datos/funciones.

const AV_PALETTE = ['#16A34A', '#2563eb', '#db2777', '#d97706', '#7c3aed', '#0891b2'];

// Color de avatar determinístico a partir de las iniciales del usuario.
export function avatarColor(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return AV_PALETTE[h % AV_PALETTE.length];
}

export const TIPO_COLOR = {
  Beca:     { color: '#16A34A', bg: '#dcfce7' },
  Admisión: { color: '#2563eb', bg: '#dbeafe' },
  SENA:     { color: '#d97706', bg: '#fef3c7' },
  Evento:   { color: '#7c3aed', bg: '#ede9fe' },
};

export const AREAS_CHIPS = ['Tecnología', 'Salud', 'Negocios', 'Artes', 'Educación', 'Ambiente'];
export const CONV_FILTERS = ['Todas', 'Beca', 'Admisión', 'SENA', 'Evento'];
