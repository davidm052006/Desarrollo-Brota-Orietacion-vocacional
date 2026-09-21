import { useState, useEffect, useCallback } from 'react';
import * as adminService from '../../../../services/adminService';
import Modal from '../components/Modal';

const FORM_VACIO = {
  tipo: '', titulo: '', institucion: '', ciudad: 'Nacional', descripcion: '',
  url: '', fecha_cierre: '', activa: true,
};

function Campo({ label, name, form, setForm, type = 'text', required = false }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}{required ? ' *' : ''}</label>
      <input
        type={type}
        value={form[name] ?? ''}
        required={required}
        onChange={event => setForm(current => ({ ...current, [name]: event.target.value }))}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
    </div>
  );
}

function FormCampos({ form, setForm }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Campo label="Tipo" name="tipo" form={form} setForm={setForm} required />
      <Campo label="Título" name="titulo" form={form} setForm={setForm} required />
      <Campo label="Institución" name="institucion" form={form} setForm={setForm} required />
      <Campo label="Ciudad" name="ciudad" form={form} setForm={setForm} />
      <Campo label="Fecha de cierre" name="fecha_cierre" form={form} setForm={setForm} type="datetime-local" />
      <Campo label="URL" name="url" form={form} setForm={setForm} type="url" />
      <div className="col-span-2">
        <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
        <textarea
          value={form.descripcion}
          onChange={event => setForm(current => ({ ...current, descripcion: event.target.value }))}
          rows={3}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={form.activa}
          onChange={event => setForm(current => ({ ...current, activa: event.target.checked }))}
          className="accent-primary"
        />
        Activa
      </label>
    </div>
  );
}

function fechaVisible(fecha) {
  if (!fecha) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(fecha));
}

export default function ConvocatoriasSection() {
  const [convocatorias, setConvocatorias] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pagina: 1, totalPaginas: 1 });
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(FORM_VACIO);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalEditar, setModalEditar] = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    const respuesta = await adminService.getConvocatorias({ pagina, busqueda });
    if (respuesta.success) {
      setConvocatorias(respuesta.data || []);
      setMeta(respuesta.meta || { total: 0, pagina: 1, totalPaginas: 1 });
    }
    setLoading(false);
  }, [pagina, busqueda]);

  useEffect(() => { cargar(); }, [cargar]); // eslint-disable-line react-hooks/set-state-in-effect

  const abrirNuevo = () => {
    setForm(FORM_VACIO);
    setFormError(null);
    setModalNuevo(true);
  };

  const abrirEditar = convocatoria => {
    setForm({
      tipo: convocatoria.tipo || '', titulo: convocatoria.titulo || '',
      institucion: convocatoria.institucion || '', ciudad: convocatoria.ciudad || 'Nacional',
      descripcion: convocatoria.descripcion || '', url: convocatoria.url || '',
      fecha_cierre: convocatoria.fecha_cierre ? convocatoria.fecha_cierre.slice(0, 16) : '',
      activa: convocatoria.activa ?? true,
    });
    setFormError(null);
    setModalEditar(convocatoria);
  };

  const guardar = async (editar = false) => {
    setGuardando(true);
    setFormError(null);
    const respuesta = editar
      ? await adminService.updateConvocatoria(modalEditar.id, form)
      : await adminService.createConvocatoria(form);
    if (!respuesta.success) {
      setFormError(respuesta.error);
      setGuardando(false);
      return;
    }
    setModalNuevo(false);
    setModalEditar(null);
    setGuardando(false);
    cargar();
  };

  const eliminar = async () => {
    setGuardando(true);
    const respuesta = await adminService.deleteConvocatoria(modalEliminar.id);
    if (!respuesta.success) {
      setFormError(respuesta.error);
      setGuardando(false);
      return;
    }
    setModalEliminar(null);
    setGuardando(false);
    cargar();
  };

  const modalFormulario = modalNuevo || modalEditar;

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Convocatorias</h2>
          <p className="text-sm text-gray-400">{meta.total} oportunidad(es) publicadas</p>
        </div>
        <button onClick={abrirNuevo} className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          <span className="text-lg leading-none">+</span> Nueva convocatoria
        </button>
      </div>

      <div className="px-5 py-3 border-b border-gray-100">
        <input
          type="search"
          placeholder="Buscar por título, institución o ciudad..."
          value={busqueda}
          onChange={event => { setBusqueda(event.target.value); setPagina(1); }}
          className="w-full max-w-md px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="overflow-x-auto">
        {loading ? <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" /></div> : convocatorias.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400"><span className="text-4xl mb-2">📣</span><p className="text-sm">No se encontraron convocatorias</p></div>
        ) : (
          <table className="w-full min-w-[760px]">
            <thead><tr className="text-left border-b border-gray-100">{['Título', 'Institución', 'Cierre', 'Estado', 'Acciones'].map(titulo => <th key={titulo} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{titulo}</th>)}</tr></thead>
            <tbody>
              {convocatorias.map(convocatoria => (
                <tr key={convocatoria.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5"><div className="text-sm font-medium text-gray-900">{convocatoria.titulo}</div><div className="text-xs text-gray-400">{convocatoria.tipo} · {convocatoria.ciudad}</div></td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{convocatoria.institucion}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{fechaVisible(convocatoria.fecha_cierre)}</td>
                  <td className="px-5 py-3.5"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${convocatoria.activa ? 'bg-primary-soft text-primary' : 'bg-red-100 text-red-600'}`}>{convocatoria.activa ? 'Activa' : 'Inactiva'}</span></td>
                  <td className="px-5 py-3.5"><div className="flex items-center gap-1.5"><button onClick={() => abrirEditar(convocatoria)} className="p-1.5 text-primary hover:bg-primary-soft rounded-lg" title="Editar">✏️</button><button onClick={() => { setFormError(null); setModalEliminar(convocatoria); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Eliminar">🗑️</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && meta.total > 0 && <div className="flex items-center justify-between px-5 py-3"><p className="text-sm text-gray-400">Página {meta.pagina} de {meta.totalPaginas} — {meta.total} convocatorias</p><div className="flex gap-1"><button onClick={() => setPagina(value => Math.max(1, value - 1))} disabled={pagina === 1} className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-40">‹ Anterior</button><button onClick={() => setPagina(value => Math.min(meta.totalPaginas, value + 1))} disabled={pagina === meta.totalPaginas} className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-40">Siguiente ›</button></div></div>}

      {modalFormulario && <Modal title={modalNuevo ? 'Nueva convocatoria' : 'Editar convocatoria'} onClose={() => { setModalNuevo(false); setModalEditar(null); }} size="lg"><FormCampos form={form} setForm={setForm} />{formError && <p className="text-sm text-red-500 mt-3">{formError}</p>}<div className="flex justify-end gap-2 mt-4"><button onClick={() => { setModalNuevo(false); setModalEditar(null); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button><button onClick={() => guardar(Boolean(modalEditar))} disabled={guardando} className="px-4 py-2 text-sm font-semibold bg-primary hover:bg-primary-hover text-white rounded-lg disabled:opacity-50">{guardando ? 'Guardando...' : modalNuevo ? 'Crear convocatoria' : 'Guardar cambios'}</button></div></Modal>}

      {modalEliminar && <Modal title="Eliminar convocatoria" onClose={() => setModalEliminar(null)} size="sm"><p className="text-sm text-gray-600 mb-4">¿Eliminar <strong>{modalEliminar.titulo}</strong>?</p>{formError && <p className="text-sm text-red-500 mb-3">{formError}</p>}<div className="flex justify-end gap-2"><button onClick={() => setModalEliminar(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button><button onClick={eliminar} disabled={guardando} className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50">{guardando ? 'Eliminando...' : 'Sí, eliminar'}</button></div></Modal>}
    </div>
  );
}
