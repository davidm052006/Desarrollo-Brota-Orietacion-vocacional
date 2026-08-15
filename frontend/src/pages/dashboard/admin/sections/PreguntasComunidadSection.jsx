import { useState, useEffect, useCallback, Fragment } from 'react';
import * as adminService from '../../../../services/adminService';
import Modal from '../components/Modal';

// Moderación de preguntas de comunidad: solo lectura + eliminar (no se editan,
// son contenido de usuarios). El conteo de reportes viene del backend
// (tabla reportes_pregunta) — a partir de 3 el autor queda baneado de preguntar
// automáticamente (ver preguntasController.reportarPregunta), esta sección es
// para que el admin decida si además elimina la pregunta reportada.
export default function PreguntasComunidadSection() {
  const [preguntas, setPreguntas] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState(null);
  const [expandidas, setExpandidas] = useState(new Set());

  const toggleExpandir = (id) => {
    setExpandidas(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const fetchPreguntas = useCallback(async () => {
    setLoading(true);
    const { success, data } = await adminService.getPreguntasComunidad();
    if (success) setPreguntas(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPreguntas(); }, [fetchPreguntas]);

  const confirmarEliminar = async () => {
    setGuardando(true);
    const { success, error } = await adminService.deletePreguntaComunidad(modalEliminar.id);
    if (!success) { setFormError(error); setGuardando(false); return; }
    setModalEliminar(null);
    setGuardando(false);
    fetchPreguntas();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Preguntas de comunidad</h2>
          <p className="text-sm text-gray-400">{preguntas.length > 0 ? `${preguntas.length} preguntas` : 'Moderación de dudas publicadas por usuarios'}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-500" /></div>
        ) : preguntas.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400"><span className="text-4xl mb-2">❓</span><p className="text-sm">No hay preguntas publicadas</p></div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-100">
                {['Título', 'Área', 'Autor', 'Respuestas', 'Reportes', 'Estado', 'Fecha', 'Acciones'].map(h => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preguntas.map(p => {
                const abierta = expandidas.has(p.id);
                return (
                  <Fragment key={p.id}>
                    <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-sm text-gray-900 max-w-xs"><span className="line-clamp-2">{p.titulo}</span></td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">{p.area}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">{p.autor}</td>
                      <td className="px-5 py-3.5">
                        {p.respuestas.length > 0 ? (
                          <button
                            onClick={() => toggleExpandir(p.id)}
                            className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200"
                          >
                            {p.respuestas.length} {abierta ? '▲' : '▼'}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">0</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.reportes >= 3 ? 'bg-red-100 text-red-700' : p.reportes > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                          🚩 {p.reportes}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.resuelta ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {p.resuelta ? 'Resuelta' : 'Abierta'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">{new Date(p.created_at).toLocaleDateString('es-CO')}</td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => { setFormError(null); setModalEliminar(p); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Eliminar">🗑️</button>
                      </td>
                    </tr>
                    {abierta && p.respuestas.length > 0 && (
                      <tr key={`${p.id}-respuestas`} className="border-b border-gray-50 bg-gray-50">
                        <td colSpan={8} className="px-5 py-3">
                          <div className="flex flex-col gap-2">
                            {p.respuestas.map(r => (
                              <div key={r.id} className={`text-sm rounded-lg p-2.5 ${r.mejor ? 'bg-green-50 border border-green-200' : 'bg-white border border-gray-100'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-semibold text-gray-700">{r.autor}</span>
                                  <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('es-CO')}</span>
                                  {r.mejor && <span className="text-xs font-semibold text-green-700">★ Mejor respuesta</span>}
                                </div>
                                <p className="text-gray-800">{r.contenido}</p>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalEliminar && (
        <Modal title="Eliminar pregunta" onClose={() => setModalEliminar(null)} size="sm">
          <p className="text-sm text-gray-600 mb-1">¿Eliminar <strong>{modalEliminar.titulo}</strong>?</p>
          <p className="text-xs text-gray-400 mb-4">Se eliminarán también sus respuestas y reportes asociados.</p>
          {formError && <p className="text-sm text-red-500 mb-3">{formError}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={() => setModalEliminar(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button onClick={confirmarEliminar} disabled={guardando} className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50">
              {guardando ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
