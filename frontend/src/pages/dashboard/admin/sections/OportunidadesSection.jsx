import { useState, useEffect, useCallback } from 'react';
import * as adminService from '../../../../services/adminService';
import Modal from '../components/Modal';

const TIPO_COLORS = {
  'Universitario': 'bg-blue-100 text-blue-700',
  'Técnico':       'bg-yellow-100 text-yellow-700',
  'Tecnológico':   'bg-purple-100 text-purple-700',
};

const FORM_VACIO = { nombre: '', tipo: '', area_academica: '', duracion: '', modalidad: '', descripcion: '', institucion_id: '', activo: true };

function Campo({ label, name, type = 'text', form, setForm }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <input type={type} value={form[name] ?? ''}
        onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
    </div>
  );
}

function FormCampos({ f, setF, instituciones }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Campo label="Nombre *"       name="nombre"        form={f} setForm={setF} />
      <Campo label="Tipo"           name="tipo"          form={f} setForm={setF} />
      <Campo label="Área académica" name="area_academica" form={f} setForm={setF} />
      <Campo label="Duración"       name="duracion"      form={f} setForm={setF} />
      <Campo label="Modalidad"      name="modalidad"     form={f} setForm={setF} />
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Institución</label>
        <select value={f.institucion_id} onChange={e => setF(p => ({ ...p, institucion_id: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white">
          <option value="">Sin institución</option>
          {instituciones.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
        </select>
      </div>
      <div className="col-span-2">
        <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
        <textarea value={f.descripcion} onChange={e => setF(p => ({ ...p, descripcion: e.target.value }))} rows={2}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="activo" checked={f.activo} onChange={e => setF(p => ({ ...p, activo: e.target.checked }))} className="accent-primary" />
        <label htmlFor="activo" className="text-sm text-gray-700">Activo</label>
      </div>
    </div>
  );
}

export default function OportunidadesSection() {
  const [programas, setProgramas]   = useState([]);
  const [meta, setMeta]             = useState({ total: 0, pagina: 1, totalPaginas: 1 });
  const [instituciones, setInstituciones] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [pagina, setPagina]         = useState(1);
  const [busqueda, setBusqueda]     = useState('');

  const [modalEditar,   setModalEditar]   = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [modalNuevo,    setModalNuevo]    = useState(false);

  const [form,      setForm]      = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchProgramas = useCallback(async () => {
    setLoading(true);
    const { success, data, meta: m } = await adminService.getProgramas({ pagina, busqueda });
    if (success) { setProgramas(data); setMeta(m); }
    setLoading(false);
  }, [pagina, busqueda]);

  useEffect(() => { fetchProgramas(); }, [fetchProgramas]);

  useEffect(() => {
    adminService.getInstituciones({ limite: 50 }).then(({ success, data }) => {
      if (success) setInstituciones(data);
    });
  }, []);

  const abrirEditar = (p) => {
    setForm({ nombre: p.nombre || '', tipo: p.tipo || '', area_academica: p.area_academica || '', duracion: p.duracion || '', modalidad: p.modalidad || '', descripcion: p.descripcion || '', institucion_id: p.institucion_id || '', activo: p.activo ?? true });
    setFormError(null);
    setModalEditar(p);
  };

  const guardarEdicion = async () => {
    setGuardando(true);
    setFormError(null);
    const { success, error } = await adminService.updatePrograma(modalEditar.id, form);
    if (!success) { setFormError(error); setGuardando(false); return; }
    setModalEditar(null);
    setGuardando(false);
    fetchProgramas();
  };

  const crearPrograma = async () => {
    setGuardando(true);
    setFormError(null);
    const { success, error } = await adminService.createPrograma(form);
    if (!success) { setFormError(error); setGuardando(false); return; }
    setModalNuevo(false);
    setGuardando(false);
    fetchProgramas();
  };

  const confirmarEliminar = async () => {
    setGuardando(true);
    const { success, error } = await adminService.deletePrograma(modalEliminar.id);
    if (!success) { setFormError(error); setGuardando(false); return; }
    setModalEliminar(null);
    setGuardando(false);
    fetchProgramas();
  };

  const abrirNuevo = () => { setForm(FORM_VACIO); setFormError(null); setModalNuevo(true); };

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Programas</h2>
          <p className="text-sm text-gray-400">{meta.total > 0 ? `${meta.total} programas registrados` : 'Gestiona convocatorias y programas disponibles'}</p>
        </div>
        <button onClick={abrirNuevo} className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          <span className="text-lg leading-none">+</span> Nuevo programa
        </button>
      </div>

      <div className="px-5 py-3 border-b border-gray-100">
        <input type="text" placeholder="Buscar programas..." value={busqueda}
          onChange={e => { setBusqueda(e.target.value); setPagina(1); }}
          className="w-full max-w-sm pl-4 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" /></div>
        ) : programas.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400"><span className="text-4xl mb-2">📚</span><p className="text-sm">No se encontraron programas</p></div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-100">
                {['Nombre', 'Institución', 'Tipo', 'Área', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {programas.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{p.nombre}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{p.institucion_nombre}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TIPO_COLORS[p.tipo] || 'bg-gray-100 text-gray-600'}`}>{p.tipo || '—'}</span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{p.area_academica || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.activo ? 'bg-primary-soft text-primary' : 'bg-red-100 text-red-600'}`}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => abrirEditar(p)} className="p-1.5 text-primary hover:bg-primary-soft rounded-lg" title="Editar">✏️</button>
                      <button onClick={() => { setFormError(null); setModalEliminar(p); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Eliminar">🗑️</button>
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
          <p className="text-sm text-gray-400">Página {meta.pagina} de {meta.totalPaginas} — {meta.total} programas</p>
          <div className="flex gap-1">
            <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1} className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-40">‹ Anterior</button>
            <button onClick={() => setPagina(p => Math.min(meta.totalPaginas, p + 1))} disabled={pagina === meta.totalPaginas} className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-40">Siguiente ›</button>
          </div>
        </div>
      )}

      {modalNuevo && (
        <Modal title="Nuevo programa" onClose={() => setModalNuevo(false)} size="lg">
          <FormCampos f={form} setF={setForm} instituciones={instituciones} />
          {formError && <p className="text-sm text-red-500 mt-3">{formError}</p>}
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setModalNuevo(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button onClick={crearPrograma} disabled={guardando} className="px-4 py-2 text-sm font-semibold bg-primary hover:bg-primary-hover text-white rounded-lg disabled:opacity-50">
              {guardando ? 'Creando...' : 'Crear programa'}
            </button>
          </div>
        </Modal>
      )}

      {modalEditar && (
        <Modal title="Editar programa" onClose={() => setModalEditar(null)} size="lg">
          <FormCampos f={form} setF={setForm} instituciones={instituciones} />
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
        <Modal title="Eliminar programa" onClose={() => setModalEliminar(null)} size="sm">
          <p className="text-sm text-gray-600 mb-4">¿Eliminar <strong>{modalEliminar.nombre}</strong>?</p>
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
