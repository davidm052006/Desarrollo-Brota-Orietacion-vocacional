export const ESTADOS = [
  { key: '',           label: 'Todos' },
  { key: 'pendiente',  label: 'Pendientes' },
  { key: 'leido',      label: 'Leídos' },
  { key: 'respondido', label: 'Respondidos' },
  { key: 'archivado',  label: 'Archivados' },
];

export const ESTADO_BADGE = {
  pendiente:  'bg-yellow-100 text-yellow-700',
  leido:      'bg-blue-100   text-blue-700',
  respondido: 'bg-green-100  text-green-700',
  archivado:  'bg-gray-100   text-gray-500',
};

export const ESTADO_LABEL = {
  pendiente:  'Pendiente',
  leido:      'Leído',
  respondido: 'Respondido',
  archivado:  'Archivado',
};

export function formatFecha(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CO', {
    dateStyle: 'medium', timeStyle: 'short',
  });
}
