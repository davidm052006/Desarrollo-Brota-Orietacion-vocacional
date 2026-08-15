import { formatFecha } from '../../components/formatFecha';
import { ROL_COLORS } from './constants';

// Tabla de usuarios + paginación. Recibe todo por props: no sabe de dónde
// vienen los datos ni qué pasa cuando se hace click en editar/ver/eliminar.
export default function TablaUsuarios({ usuarios, meta, loading, pagina, setPagina, onEditar, onVer, onEliminar }) {
  return (
    <>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-500" />
          </div>
        ) : usuarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="text-4xl mb-2">👥</span>
            <p className="text-sm">No se encontraron usuarios</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-100">
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ciudad</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nivel educativo</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rol</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Registro</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{u.nombre} {u.apellido}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{u.ciudad || '—'}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{u.nivel_educativo || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROL_COLORS[u.rol] || 'bg-gray-100 text-gray-600'}`}>
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{formatFecha(u.created_at)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => onEditar(u)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Editar">✏️</button>
                      <button onClick={() => onVer(u)}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Ver detalle">👁️</button>
                      <button onClick={() => onEliminar(u)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && meta.total > 0 && (
        <div className="flex items-center justify-between px-5 py-3">
          <p className="text-sm text-gray-400">
            Página {meta.pagina} de {meta.totalPaginas} — {meta.total.toLocaleString('es-CO')} usuarios
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
              className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              ‹ Anterior
            </button>
            {Array.from({ length: Math.min(5, meta.totalPaginas) }, (_, i) => {
              const n = Math.max(1, Math.min(pagina - 2, meta.totalPaginas - 4)) + i;
              return (
                <button key={n} onClick={() => setPagina(n)}
                  className={`w-8 h-8 text-sm rounded-lg transition-colors ${pagina === n ? 'bg-green-600 text-white font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {n}
                </button>
              );
            })}
            <button onClick={() => setPagina(p => Math.min(meta.totalPaginas, p + 1))} disabled={pagina === meta.totalPaginas}
              className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Siguiente ›
            </button>
          </div>
        </div>
      )}
    </>
  );
}
