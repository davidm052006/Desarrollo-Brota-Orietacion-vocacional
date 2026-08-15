// Separado de formPrimitives.jsx a propósito: ese archivo solo debe exportar
// componentes para que Vite pueda aplicar Fast Refresh correctamente.
export function formatFecha(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO');
}
