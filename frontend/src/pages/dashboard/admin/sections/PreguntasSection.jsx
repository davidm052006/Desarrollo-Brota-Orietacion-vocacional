import { useState, useEffect, useCallback } from 'react';
import * as adminService from '../../../../services/adminService';
import Modal from '../components/Modal';

const TIPO_COLORS = {
  'opcion_multiple': 'bg-blue-100 text-blue-700',
  'likert':          'bg-purple-100 text-purple-700',
};

const CATEGORIA_COLORS = {
  'intereses':   'bg-yellow-100 text-yellow-700',
  'habilidades': 'bg-green-100 text-green-700',
  'vocacion':    'bg-pink-100 text-pink-700',
  'contexto':    'bg-orange-100 text-orange-700',
};

const FORM_VACIO = { cuestionario_id: '', texto: '', tipo: 'opcion_multiple', orden: '', categoria: '', peso: '1.0' };

function FormCampos({ f, setF, cuestionarios }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Cuestionario *</label>
        <select value={f.cuestionario_id} onChange={e => setF(p => ({ ...p, cuestionario_id: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white">
          <option value="">Seleccionar cuestionario</option>
          {cuestionarios.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.version}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Texto de la pregunta *</label>
        <textarea value={f.texto} onChange={e => setF(p => ({ ...p, texto: e.target.value }))} rows={2}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300 resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo</label>
          <select value={f.tipo} onChange={e => setF(p => ({ ...p, tipo: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white">
            <option value="opcion_multiple">Opción múltiple</option>
            <option value="likert">Likert</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Categoría</label>
          <select value={f.categoria} onChange={e => setF(p => ({ ...p, categoria: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white">
            <option value="">Sin categoría</option>
            {['intereses', 'habilidades', 'vocacion', 'contexto'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Orden</label>
          <input type="number" value={f.orden} onChange={e => setF(p => ({ ...p, orden: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Peso</label>
          <input type="number" step="0.1" value={f.peso} onChange={e => setF(p => ({ ...p, peso: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
        </div>
      </div>
    </div>
  );
}

// filtroCuestionarioId: id opcional que llega desde CuestionariosSection (botón "Ver preguntas")
// para pre-seleccionar el filtro al entrar a esta sección.
export default function PreguntasSection({ filtroCuestionarioId = '' }) {
  const [preguntas, setPreguntas]         = useState([]);
  const [cuestionarios, setCuestionarios] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [busqueda, setBusqueda]           = useState('');
  const [filtroC, setFiltroC]             = useState(filtroCuestionarioId);

  const [modalEditar,   setModalEditar]   = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [modalNuevo,    setModalNuevo]    = useState(false);

  const [form,      setForm]      = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState(null);

  // filtroCuestionarioId llega como valor inicial. AdminPanel usa una `key` para
  // remontar este componente cuando cambia, así el estado siempre parte correcto
  // sin necesidad de sincronizarlo con un efecto.

  const fetchPreguntas = useCallback(async () => {
    setLoading(true);
    const { success, data } = await adminService.getPreguntas({ cuestionario_id: filtroC, busqueda });
    if (success) setPreguntas(data);
    setLoading(false);
  }, [filtroC, busqueda]);

  useEffect(() => { fetchPreguntas(); }, [fetchPreguntas]); // eslint-disable-line react-hooks/set-state-in-effect

  useEffect(() => {
    adminService.getCuestionarios().then(({ success, data }) => {
      if (success) setCuestionarios(data);
    });
  }, []); // eslint-disable-line react-hooks/set-state-in-effect

  const abrirEditar = (p) => {
    setForm({ cuestionario_id: p.cuestionario_id || '', texto: p.texto || '', tipo: p.tipo || 'opcion_multiple', orden: p.orden ?? '', categoria: p.categoria || '', peso: p.peso ?? '1.0' });
    setFormError(null);
    setModalEditar(p);
  };

  const guardarEdicion = async () => {
    setGuardando(true);
    setFormError(null);
    const { success, error } = await adminService.updatePregunta(modalEditar.id, { ...form, orden: parseInt(form.orden) || 1, peso: parseFloat(form.peso) || 1.0 });
    if (!success) { setFormError(error); setGuardando(false); return; }
    setModalEditar(null);
    setGuardando(false);
    fetchPreguntas();
  };

  const crearPregunta = async () => {
    setGuardando(true);
    setFormError(null);
    const { success, error } = await adminService.createPregunta({ ...form, orden: parseInt(form.orden) || 1, peso: parseFloat(form.peso) || 1.0 });
    if (!success) { setFormError(error); setGuardando(false); return; }
    setModalNuevo(false);
    setGuardando(false);
    fetchPreguntas();
  };

  const confirmarEliminar = async () => {
    setGuardando(true);
    const { success, error } = await adminService.deletePregunta(modalEliminar.id);
    if (!success) { setFormError(error); setGuardando(false); return; }
    setModalEliminar(null);
    setGuardando(false);
    fetchPreguntas();
  };

  const abrirNuevo = () => {
    setForm({ ...FORM_VACIO, cuestionario_id: filtroC });
    setFormError(null);
    setModalNuevo(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Preguntas</h2>
          <p className="text-sm text-gray-400">{preguntas.length > 0 ? `${preguntas.length} preguntas` : 'Gestiona las preguntas del test vocacional'}</p>
        </div>
        <button onClick={abrirNuevo} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          <span className="text-lg leading-none">+</span> Nueva pregunta
        </button>
      </div>

      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
        <input type="text" placeholder="Buscar preguntas..." value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="flex-1 max-w-sm pl-4 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
        <select value={filtroC} onChange={e => setFiltroC(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-300 bg-white">
          <option value="">Todos los cuestionarios</option>
          {cuestionarios.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.version}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-500" /></div>
        ) : preguntas.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400"><span className="text-4xl mb-2">❓</span><p className="text-sm">No se encontraron preguntas</p></div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-100">
                {['Orden', 'Texto', 'Tipo', 'Categoría', 'Peso', 'Acciones'].map(h => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preguntas.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 text-sm text-gray-500 font-mono">#{p.orden}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-900 max-w-xs">
                    <span className="line-clamp-2">{p.texto}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TIPO_COLORS[p.tipo] || 'bg-gray-100 text-gray-600'}`}>{p.tipo}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORIA_COLORS[p.categoria] || 'bg-gray-100 text-gray-600'}`}>{p.categoria || '—'}</span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{p.peso}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => abrirEditar(p)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Editar">✏️</button>
                      <button onClick={() => { setFormError(null); setModalEliminar(p); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Eliminar">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalNuevo && (
        <Modal title="Nueva pregunta" onClose={() => setModalNuevo(false)} size="lg">
          <FormCampos f={form} setF={setForm} cuestionarios={cuestionarios} />
          {formError && <p className="text-sm text-red-500 mt-3">{formError}</p>}
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setModalNuevo(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button onClick={crearPregunta} disabled={guardando} className="px-4 py-2 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50">
              {guardando ? 'Creando...' : 'Crear pregunta'}
            </button>
          </div>
        </Modal>
      )}

      {modalEditar && (
        <Modal title="Editar pregunta" onClose={() => setModalEditar(null)} size="lg">
          <FormCampos f={form} setF={setForm} cuestionarios={cuestionarios} />
          {formError && <p className="text-sm text-red-500 mt-3">{formError}</p>}
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setModalEditar(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button onClick={guardarEdicion} disabled={guardando} className="px-4 py-2 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </Modal>
      )}

      {modalEliminar && (
        <Modal title="Eliminar pregunta" onClose={() => setModalEliminar(null)} size="sm">
          <p className="text-sm text-gray-600 mb-4">¿Eliminar la pregunta <strong>#{modalEliminar.orden}</strong>?</p>
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