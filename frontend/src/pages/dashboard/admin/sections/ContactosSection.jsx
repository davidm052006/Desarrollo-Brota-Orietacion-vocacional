import { useState, useEffect, useCallback } from 'react';
import { getContactos } from '../../../../services/contactoService';
import ContactoCard from './contactos/ContactoCard';
import { ESTADOS, ESTADO_LABEL } from './contactos/constants';

// Sección "Solicitudes de contacto": trae la lista paginada/filtrada y
// delega el render de cada solicitud a ContactoCard.
export default function ContactosSection() {
  const [contactos, setContactos] = useState([]);
  const [meta, setMeta]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [pagina, setPagina]       = useState(1);
  const [error, setError]         = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    setError('');
    const { success, data, meta: m, error: err } = await getContactos({
      estado: filtroEstado,
      pagina,
      limite: 20,
    });
    setLoading(false);
    if (success) { setContactos(data || []); setMeta(m); }
    else setError(err || 'Error al cargar contactos.');
  }, [filtroEstado, pagina]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleFiltro = (estado) => {
    setFiltroEstado(estado);
    setPagina(1);
  };

  const pendientes = contactos.filter(c => c.estado === 'pendiente').length;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">

      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-gray-800">Solicitudes de contacto</h2>
          {meta && (
            <p className="text-xs text-gray-400 mt-0.5">
              {meta.total} solicitudes
              {pendientes > 0 && <span className="ml-2 text-yellow-600 font-medium">· {pendientes} sin leer</span>}
            </p>
          )}
        </div>
        <button
          onClick={cargar}
          className="text-xs text-gray-400 hover:text-emerald-600 transition-colors"
          disabled={loading}
        >
          ↻ Actualizar
        </button>
      </div>

      <div className="flex gap-1 mb-5 border-b border-gray-100 pb-3">
        {ESTADOS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleFiltro(key)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filtroEstado === key
                ? 'bg-emerald-600 text-white'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500" />
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-8 text-sm text-red-500">{error}</div>
      )}

      {!loading && !error && contactos.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-3">📭</p>
          <p className="text-sm">No hay solicitudes {filtroEstado ? `con estado "${ESTADO_LABEL[filtroEstado]}"` : ''}.</p>
        </div>
      )}

      {!loading && !error && contactos.length > 0 && (
        <div className="space-y-3">
          {contactos.map(c => (
            <ContactoCard key={c.id} contacto={c} onActualizar={cargar} />
          ))}
        </div>
      )}

      {meta && meta.totalPaginas > 1 && (
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
          <button
            onClick={() => setPagina(p => Math.max(1, p - 1))}
            disabled={pagina <= 1 || loading}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            ← Anterior
          </button>
          <span className="text-xs text-gray-400">
            Página {pagina} de {meta.totalPaginas}
          </span>
          <button
            onClick={() => setPagina(p => Math.min(meta.totalPaginas, p + 1))}
            disabled={pagina >= meta.totalPaginas || loading}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            Siguiente →
          </button>
        </div>
      )}

    </div>
  );
}
