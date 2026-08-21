import { useState, useEffect } from 'react';
import * as adminService from '../../../../services/adminService';
import Modal from '../components/Modal';

const FORM_VACIO = { nombre: '', version: '', descripcion: '', activo: false };

function Campo({ label, name, form, setForm }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <input value={form[name] ?? ''} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
    </div>
  );
}

function FormCampos({ f, setF }) {
  return (
    <div className="space-y-3">
      <Campo label="Nombre *"  name="nombre"  form={f} setForm={setF} />
      <Campo label="Versión *" name="version" form={f} setForm={setF} />
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
        <textarea value={f.descripcion} onChange={e => setF(p => ({ ...p, descripcion: e.target.value }))} rows={2}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="activo-c" checked={f.activo} onChange={e => setF(p => ({ ...p, activo: e.target.checked }))} className="accent-primary" />
        <label htmlFor="activo-c" className="text-sm text-gray-700">Activo (desactivará los demás)</label>
      </div>
    </div>
  );
}

// onVerPreguntas: función que llega desde AdminPanel — navega a la sección
// Preguntas dejando pre-seleccionado el cuestionario de la fila (filtroC).
export default function CuestionariosSection({ onVerPreguntas }) {
  const [cuestionarios, setCuestionarios] = useState([]);
  const [loading, setLoading]             = useState(true);

  const [modalEditar,   setModalEditar]   = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [modalNuevo,    setModalNuevo]    = useState(false);

  const [form,      setForm]      = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchCuestionarios = async () => {
    setLoading(true);
    const { success, data } = await adminService.getCuestionarios();
    if (success) setCuestionarios(data);
    setLoading(false);
  };

  useEffect(() => { fetchCuestionarios(); }, []); // eslint-disable-line react-hooks/set-state-in-effect

  const abrirEditar = (c) => {
    setForm({ nombre: c.nombre || '', version: c.version || '', descripcion: c.descripcion || '', activo: c.activo ?? false });
    setFormError(null);
    setModalEditar(c);
  };

  const guardarEdicion = async () => {
    setGuardando(true);
    setFormError(null);
    const { success, error } = await adminService.updateCuestionario(modalEditar.id, form);
    if (!success) { setFormError(error); setGuardando(false); return; }
    setModalEditar(null);
    setGuardando(false);
    fetchCuestionarios();
  };

  const crearCuestionario = async () => {
    setGuardando(true);
    setFormError(null);
    const { success, error } = await adminService.createCuestionario(form);
    if (!success) { setFormError(error); setGuardando(false); return; }
    setModalNuevo(false);
    setGuardando(false);
    fetchCuestionarios();
  };

  const confirmarEliminar = async () => {
    setGuardando(true);
    const { success, error } = await adminService.deleteCuestionario(modalEliminar.id);
    if (!success) { setFormError(error); setGuardando(false); return; }
    setModalEliminar(null);
    setGuardando(false);
    fetchCuestionarios();
  };

  const toggleActivo = async (c) => {
    await adminService.updateCuestionario(c.id, { ...c, activo: !c.activo });
    fetchCuestionarios();
  };

  const abrirNuevo = () => { setForm(FORM_VACIO); setFormError(null); setModalNuevo(true); };

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Cuestionarios</h2>
          <p className="text-sm text-gray-400">Gestiona las versiones del test vocacional.</p>
        </div>
        <button onClick={abrirNuevo} className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          <span className="text-lg leading-none">+</span> Nuevo cuestionario
        </button>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" /></div>
        ) : cuestionarios.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400"><span className="text-4xl mb-2">📋</span><p className="text-sm">No hay cuestionarios</p></div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-100">
                {['Nombre', 'Versión', 'N° Preguntas', 'Fecha creación', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cuestionarios.map(c => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{c.nombre}</td>
                  <td className="px-5 py-3.5">
                    <span className="bg-gray-100 text-gray-600 text-xs font-mono font-semibold px-2.5 py-1 rounded-full">{c.version}</span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{c.num_preguntas}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{new Date(c.created_at).toLocaleDateString('es-CO')}</td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => toggleActivo(c)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-opacity hover:opacity-75 ${c.activo ? 'bg-primary-soft text-primary' : 'bg-gray-100 text-gray-500'}`}>
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => onVerPreguntas?.(c.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Ver preguntas de este cuestionario">
                        ❓ Ver preguntas
                      </button>
                      <button onClick={() => abrirEditar(c)} className="p-1.5 text-primary hover:bg-primary-soft rounded-lg" title="Editar">✏️</button>
                      <button onClick={() => { setFormError(null); setModalEliminar(c); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Eliminar">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalNuevo && (
        <Modal title="Nuevo cuestionario" onClose={() => setModalNuevo(false)}>
          <FormCampos f={form} setF={setForm} />
          {formError && <p className="text-sm text-red-500 mt-3">{formError}</p>}
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setModalNuevo(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button onClick={crearCuestionario} disabled={guardando} className="px-4 py-2 text-sm font-semibold bg-primary hover:bg-primary-hover text-white rounded-lg disabled:opacity-50">
              {guardando ? 'Creando...' : 'Crear cuestionario'}
            </button>
          </div>
        </Modal>
      )}

      {modalEditar && (
        <Modal title="Editar cuestionario" onClose={() => setModalEditar(null)}>
          <FormCampos f={form} setF={setForm} />
          {formError && <p className="text-sm text-red-500 mt-3">{formError}</p>}
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setModalEditar(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button onClick={guardarEdicion} disabled={guardando} className="px-4 py-2 text-sm font-semibold bg-primary hover:bg-primary-hover text-white rounded-lg disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </Modal>
      )}

      {modalEliminar && (
        <Modal title="Eliminar cuestionario" onClose={() => setModalEliminar(null)} size="sm">
          <p className="text-sm text-gray-600 mb-1">¿Eliminar <strong>{modalEliminar.nombre} {modalEliminar.version}</strong>?</p>
          <p className="text-xs text-gray-400 mb-4">Se eliminarán también todas las preguntas asociadas.</p>
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