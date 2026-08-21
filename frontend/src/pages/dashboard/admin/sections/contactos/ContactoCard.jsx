import { useState } from 'react';
import { actualizarContacto } from '../../../../../services/contactoService';
import { ESTADO_BADGE, ESTADO_LABEL, formatFecha } from './constants';

// Una solicitud de contacto: colapsada muestra el resumen, expandida permite
// leer el mensaje completo, anotar notas internas y cambiar su estado.
// Todo ese estado (expandido/notas/guardando) es local a la tarjeta — al
// padre (ContactosSection) solo le importa refrescar la lista cuando cambia algo.
export default function ContactoCard({ contacto, onActualizar }) {
  const [expandido, setExpandido]   = useState(false);
  const [notas, setNotas]           = useState(contacto.notas_admin || '');
  const [guardando, setGuardando]   = useState(false);
  const [savedMsg, setSavedMsg]     = useState('');

  const cambiarEstado = async (nuevoEstado) => {
    setGuardando(true);
    const { success } = await actualizarContacto(contacto.id, { estado: nuevoEstado });
    setGuardando(false);
    if (success) onActualizar();
  };

  const guardarNotas = async () => {
    setGuardando(true);
    const { success } = await actualizarContacto(contacto.id, { notas_admin: notas });
    setGuardando(false);
    if (success) { setSavedMsg('Guardado'); setTimeout(() => setSavedMsg(''), 2000); }
  };

  const marcarLeido = () => {
    if (contacto.estado === 'pendiente') cambiarEstado('leido');
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">

      <button
        onClick={() => { setExpandido(e => !e); marcarLeido(); }}
        className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-sm text-gray-800">{contacto.nombre}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_BADGE[contacto.estado] || 'bg-gray-100 text-gray-500'}`}>
              {ESTADO_LABEL[contacto.estado] || contacto.estado}
            </span>
            {contacto.estado === 'pendiente' && (
              <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-gray-500 mb-1.5">
            {contacto.email}
            {contacto.telefono && <> · {contacto.telefono}</>}
          </p>
          <p className="text-xs font-medium text-emerald-600 mb-1">{contacto.asunto}</p>
          <p className="text-xs text-gray-400 line-clamp-2">{contacto.mensaje}</p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-xs text-gray-400">{formatFecha(contacto.created_at)}</span>
          <span className="text-gray-300 text-lg">{expandido ? '▴' : '▾'}</span>
        </div>
      </button>

      {expandido && (
        <div className="border-t border-gray-100 px-5 py-5 bg-gray-50 space-y-5">

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Mensaje completo</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-white rounded-lg border border-gray-100 px-4 py-3">
              {contacto.mensaje}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Notas internas</p>
            <textarea
              rows={3}
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="Agrega notas sobre esta solicitud..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
            <div className="flex justify-end mt-1.5">
              {savedMsg && <span className="text-xs text-emerald-600 mr-2 mt-1">{savedMsg}</span>}
              <button
                onClick={guardarNotas}
                disabled={guardando}
                className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {guardando ? 'Guardando...' : 'Guardar notas'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {contacto.estado !== 'leido' && contacto.estado !== 'respondido' && contacto.estado !== 'archivado' && (
              <button
                onClick={() => cambiarEstado('leido')}
                disabled={guardando}
                className="text-xs px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-colors"
              >
                ✓ Marcar como leído
              </button>
            )}
            {contacto.estado !== 'respondido' && contacto.estado !== 'archivado' && (
              <button
                onClick={() => cambiarEstado('respondido')}
                disabled={guardando}
                className="text-xs px-3 py-1.5 rounded-lg border border-primary/25 text-primary hover:bg-primary-soft disabled:opacity-50 transition-colors"
              >
                ✅ Marcar como respondido
              </button>
            )}
            {contacto.estado !== 'archivado' && (
              <button
                onClick={() => cambiarEstado('archivado')}
                disabled={guardando}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                🗃️ Archivar
              </button>
            )}
            {contacto.estado === 'archivado' && (
              <button
                onClick={() => cambiarEstado('pendiente')}
                disabled={guardando}
                className="text-xs px-3 py-1.5 rounded-lg border border-yellow-200 text-yellow-600 hover:bg-yellow-50 disabled:opacity-50 transition-colors"
              >
                ↩ Restaurar a pendiente
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
