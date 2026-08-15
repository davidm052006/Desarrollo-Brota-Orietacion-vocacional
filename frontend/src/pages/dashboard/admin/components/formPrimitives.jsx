// Piezas reutilizables para formularios de las secciones del panel admin.
// Nota: este mismo patrón (Campo/Detalle) está copiado también en
// CuestionariosSection.jsx, InstitucionesSection.jsx y OportunidadesSection.jsx.
// No se tocaron esos archivos en este refactor (fuera del alcance pedido),
// pero migrarlos a este módulo compartido sería el siguiente paso natural.

// Campo de texto reutilizable para formularios
export function Campo({ label, name, type = 'text', form, setForm, required = false }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={form[name]}
        onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
      />
    </div>
  );
}

// Fila de solo lectura para modales "Ver detalle"
export function Detalle({ label, value }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-gray-50 gap-4">
      <span className="text-xs font-semibold text-gray-500 shrink-0">{label}</span>
      <span className="text-sm text-gray-800 text-right">{value || '—'}</span>
    </div>
  );
}
