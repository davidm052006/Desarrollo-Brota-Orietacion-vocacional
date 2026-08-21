import { useState, useEffect, useCallback } from 'react';
import * as adminService from '../../../../services/adminService';
import Modal from '../components/Modal';

const TIPO_COLORS = {
  'Universidad': 'bg-blue-100 text-blue-700',
  'SENA':        'bg-primary-soft text-primary',
  'Tecnológica': 'bg-purple-100 text-purple-700',
  'Técnica':     'bg-yellow-100 text-yellow-700',
};

const FORM_VACIO = { nombre: '', tipo: '', ciudad: '', departamento: '', direccion: '', telefono: '', email: '', sitio_web: '', activa: true };

function Campo({ label, name, type = 'text', form, setForm }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={form[name] ?? ''}
        onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
    </div>
  );
}

function FormCampos({ f, setF }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Campo label="Nombre *"     name="nombre"      form={f} setForm={setF} />
      <Campo label="Tipo"         name="tipo"        form={f} setForm={setF} />
      <Campo label="Ciudad"       name="ciudad"      form={f} setForm={setF} />
      <Campo label="Departamento" name="departamento" form={f} setForm={setF} />
      <Campo label="Teléfono"     name="telefono"    form={f} setForm={setF} />
      <Campo label="Email"        name="email"       type="email" form={f} setForm={setF} />
      <div className="col-span-2">
        <Campo label="Sitio web" name="sitio_web" form={f} setForm={setF} />
      </div>
      <div className="col-span-2">
        <label className="block text-xs font-semibold text-gray-600 mb-1">Dirección</label>
        <input value={f.direccion} onChange={e => setF(p => ({ ...p, direccion: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="activa" checked={f.activa} onChange={e => setF(p => ({ ...p, activa: e.target.checked }))} className="accent-primary" />
        <label htmlFor="activa" className="text-sm text-gray-700">Activa</label>
      </div>
    </div>
  );
}

export default function InstitucionesSection() {
  const [instituciones, setInstituciones] = useState([]);
  const [meta, setMeta]                   = useState({ total: 0, pagina: 1, totalPaginas: 1 });
  const [loading, setLoading]             = useState(true);
  const [pagina, setPagina]               = useState(1);
  const [busqueda, setBusqueda]           = useState('');

  const [modalEditar,   setModalEditar]   = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [modalNuevo,    setModalNuevo]    = useState(false);

  const [form,      setForm]      = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchInstituciones = useCallback(async () => {
    setLoading(true);
    const { success, data, meta: m } = await adminService.getInstituciones({ pagina, busqueda });
    if (success) { setInstituciones(data); setMeta(m); }
    setLoading(false);
  }, [pagina, busqueda]);

  useEffect(() => { fetchInstituciones(); }, [fetchInstituciones]);

  const abrirEditar = (inst) => {
    setForm({ nombre: inst.nombre || '', tipo: inst.tipo || '', ciudad: inst.ciudad || '', departamento: inst.departamento || '', direccion: inst.direccion || '', telefono: inst.telefono || '', email: inst.email || '', sitio_web: inst.sitio_web || '', activa: inst.activa ?? true });
    setFormError(null);
    setModalEditar(inst);
  };

  const guardarEdicion = async () => {
    setGuardando(true);
    setFormError(null);
    const { success, error } = await adminService.updateInstitucion(modalEditar.id, form);
    if (!success) { setFormError(error); setGuardando(false); return; }
    setModalEditar(null);
    setGuardando(false);
    fetchInstituciones();
  };

  const crearInstitucion = async () => {
    setGuardando(true);
    setFormError(null);
    const { success, error } = await adminService.createInstitucion(form);
    if (!success) { setFormError(error); setGuardando(false); return; }
    setModalNuevo(false);
    setGuardando(false);
    fetchInstituciones();
  };

  const confirmarEliminar = async () => {
    setGuardando(true);
    const { success, error } = await adminService.deleteInstitucion(modalEliminar.id);
    if (!success) { setFormError(error); setGuardando(false); return; }
    setModalEliminar(null);
    setGuardando(false);
    fetchInstituciones();
  };

  const abrirNuevo = () => { setForm(FORM_VACIO); setFormError(null); setModalNuevo(true); };

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Instituciones</h2>
          <p className="text-sm text-gray-400">{meta.total > 0 ? `${meta.total} instituciones registradas` : 'Gestiona las instituciones educativas'}</p>
        </div>
        <button onClick={abrirNuevo} className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          <span className="text-lg leading-none">+</span> Nueva institución
        </button>
      </div>

      <div className="px-5 py-3 border-b border-gray-100">
        <input type="text" placeholder="Buscar por nombre o ciudad..." value={busqueda}
          onChange={e => { setBusqueda(e.target.value); setPagina(1); }}
          className="w-full max-w-sm pl-4 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" /></div>
        ) : instituciones.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400"><span className="text-4xl mb-2">🏫</span><p className="text-sm">No se encontraron instituciones</p></div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-100">
                {['Nombre', 'Tipo', 'Ciudad', 'Teléfono', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {instituciones.map(inst => (
                <tr key={inst.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{inst.nombre}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TIPO_COLORS[inst.tipo] || 'bg-gray-100 text-gray-600'}`}>{inst.tipo || '—'}</span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{inst.ciudad || '—'}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{inst.telefono || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${inst.activa ? 'bg-primary-soft text-primary' : 'bg-red-100 text-red-600'}`}>
                      {inst.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => abrirEditar(inst)} className="p-1.5 text-primary hover:bg-primary-soft rounded-lg transition-colors" title="Editar">✏️</button>
                      <button onClick={() => { setFormError(null); setModalEliminar(inst); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">🗑️</button>
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
          <p className="text-sm text-gray-400">Página {meta.pagina} de {meta.totalPaginas} — {meta.total} instituciones</p>
          <div className="flex gap-1">
            <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
              className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-40">‹ Anterior</button>
            <button onClick={() => setPagina(p => Math.min(meta.totalPaginas, p + 1))} disabled={pagina === meta.totalPaginas}
              className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-40">Siguiente ›</button>
          </div>
        </div>
      )}

      {modalNuevo && (
        <Modal title="Nueva institución" onClose={() => setModalNuevo(false)} size="lg">
          <FormCampos f={form} setF={setForm} />
          {formError && <p className="text-sm text-red-500 mt-3">{formError}</p>}
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setModalNuevo(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button onClick={crearInstitucion} disabled={guardando} className="px-4 py-2 text-sm font-semibold bg-primary hover:bg-primary-hover text-white rounded-lg disabled:opacity-50">
              {guardando ? 'Creando...' : 'Crear institución'}
            </button>
          </div>
        </Modal>
      )}

      {modalEditar && (
        <Modal title="Editar institución" onClose={() => setModalEditar(null)} size="lg">
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
        <Modal title="Eliminar institución" onClose={() => setModalEliminar(null)} size="sm">
          <p className="text-sm text-gray-600 mb-1">¿Eliminar <strong>{modalEliminar.nombre}</strong>?</p>
          <p className="text-xs text-gray-400 mb-4">Se eliminarán también los programas asociados.</p>
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
