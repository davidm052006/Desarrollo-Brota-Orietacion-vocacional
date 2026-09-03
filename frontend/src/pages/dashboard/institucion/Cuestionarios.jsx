import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../../components/Layout/DashboardLayout';
import InstitucionNav from './components/InstitucionNav';
import { obtenerPerfil } from '../../../services/perfilService';
import * as institucionService from '../../../services/institucionService';
import { CATEGORIA_OPCIONES } from '../../../utils/vocacionalCategorias';

const cardStyle = {
  background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16,
  padding: '16px 18px', marginBottom: 10,
};
const inputStyle = {
  width: '100%', padding: '8px 10px', borderRadius: 9,
  border: '1px solid var(--line)', background: 'var(--bg)',
  color: 'var(--ink)', fontSize: 13, fontFamily: 'inherit',
};
const btnPrimary = {
  background: 'var(--primary)', color: 'var(--primary-ink)', fontWeight: 700,
  fontSize: 12.5, padding: '7px 14px', borderRadius: 9, border: 'none',
  cursor: 'pointer', fontFamily: 'inherit',
};
const btnGhost = {
  background: 'none', border: 'none', color: 'var(--ink-soft)', fontSize: 12.5,
  fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
};

function OpcionEditor({ opcion, onChange, onQuitar }) {
  const pesosArray = Object.entries(opcion.pesos || {});

  const setPeso = (idx, campo, valor) => {
    const nuevos = [...pesosArray];
    nuevos[idx] = [campo === 'categoria' ? valor : nuevos[idx][0], campo === 'puntos' ? valor : nuevos[idx][1]];
    onChange({ ...opcion, pesos: Object.fromEntries(nuevos) });
  };
  const agregarPeso = () => onChange({ ...opcion, pesos: { ...opcion.pesos, '': 1 } });
  const quitarPeso = (idx) => {
    const nuevos = pesosArray.filter((_, i) => i !== idx);
    onChange({ ...opcion, pesos: Object.fromEntries(nuevos) });
  };

  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 10, marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
        <input
          placeholder="Texto de la opción" value={opcion.label}
          onChange={e => onChange({ ...opcion, label: e.target.value })}
          style={{ ...inputStyle, flex: 1 }}
        />
        <button onClick={onQuitar} style={{ ...btnGhost, color: '#dc2626' }}>✕</button>
      </div>
      {pesosArray.map(([categoria, puntos], i) => (
        <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4, alignItems: 'center' }}>
          <select value={categoria} onChange={e => setPeso(i, 'categoria', e.target.value)} style={{ ...inputStyle, flex: 1 }}>
            <option value="">Elegir categoría...</option>
            {CATEGORIA_OPCIONES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <input
            type="number" min={1} value={puntos}
            onChange={e => setPeso(i, 'puntos', e.target.value)}
            style={{ ...inputStyle, width: 64 }}
          />
          <button onClick={() => quitarPeso(i)} style={{ ...btnGhost, color: '#dc2626', fontSize: 14 }}>✕</button>
        </div>
      ))}
      <button onClick={agregarPeso} style={{ ...btnGhost, fontSize: 11.5 }}>+ Agregar peso por categoría</button>
    </div>
  );
}

const PREGUNTA_VACIA = { texto: '', tipo: 'seleccion', categoria: '', peso: 1, opciones: [{ label: '', pesos: {} }, { label: '', pesos: {} }] };

function ModalPregunta({ pregunta, onGuardar, onCerrar }) {
  const [form, setForm] = useState(pregunta || PREGUNTA_VACIA);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const cambiarOpcion = (idx, nueva) => {
    const opciones = [...form.opciones];
    opciones[idx] = nueva;
    setForm(f => ({ ...f, opciones }));
  };
  const agregarOpcion = () => setForm(f => ({ ...f, opciones: [...f.opciones, { label: '', pesos: {} }] }));
  const quitarOpcion = (idx) => setForm(f => ({ ...f, opciones: f.opciones.filter((_, i) => i !== idx) }));

  const guardar = async () => {
    if (!form.texto.trim()) { setError('El texto de la pregunta es obligatorio'); return; }
    if (form.opciones.length < 2 || form.opciones.some(o => !o.label.trim())) {
      setError('Necesitás al menos 2 opciones, todas con texto'); return;
    }
    setGuardando(true);
    setError('');
    const { success, error: err } = await onGuardar(form);
    setGuardando(false);
    if (!success) setError(err);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 18, padding: 22, width: 560, maxHeight: '88vh', overflowY: 'auto' }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>{pregunta ? 'Editar pregunta' : 'Nueva pregunta'}</h2>

        <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: 4 }}>Texto de la pregunta</label>
        <textarea rows={2} value={form.texto} onChange={e => setForm(f => ({ ...f, texto: e.target.value }))} style={{ ...inputStyle, resize: 'vertical', marginBottom: 10 }} />

        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: 4 }}>Orden</label>
            <input type="number" value={form.orden || ''} onChange={e => setForm(f => ({ ...f, orden: e.target.value }))} style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: 4 }}>Peso de la pregunta</label>
            <input type="number" step="0.1" value={form.peso} onChange={e => setForm(f => ({ ...f, peso: e.target.value }))} style={inputStyle} />
          </div>
        </div>

        <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 6 }}>
          Opciones (cada una puede sumar puntos a una o más categorías)
        </p>
        {form.opciones.map((o, i) => (
          <OpcionEditor key={i} opcion={o} onChange={(n) => cambiarOpcion(i, n)} onQuitar={() => quitarOpcion(i)} />
        ))}
        <button onClick={agregarOpcion} style={{ ...btnGhost, fontSize: 12, marginBottom: 12 }}>+ Agregar opción</button>

        {error && <p style={{ fontSize: 12, color: '#dc2626', marginBottom: 8 }}>{error}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onCerrar} style={{ ...btnGhost, padding: '8px 12px' }}>Cancelar</button>
          <button onClick={guardar} disabled={guardando} style={{ ...btnPrimary, opacity: guardando ? .6 : 1 }}>
            {guardando ? 'Guardando…' : 'Guardar pregunta'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CuestionarioCard({ cuestionario, onActivar, onEliminar }) {
  const [expandido, setExpandido] = useState(false);
  const [preguntas, setPreguntas] = useState([]);
  const [cargandoPreguntas, setCargandoPreguntas] = useState(false);
  const [modalPregunta, setModalPregunta] = useState(null); // null | {} (nueva) | pregunta (editar)

  const cargarPreguntas = useCallback(async () => {
    setCargandoPreguntas(true);
    const { success, data } = await institucionService.getPreguntas(cuestionario.id);
    if (success) setPreguntas(data || []);
    setCargandoPreguntas(false);
  }, [cuestionario.id]);

  useEffect(() => { if (expandido) cargarPreguntas(); }, [expandido, cargarPreguntas]);

  const guardarPregunta = async (form) => {
    const payload = { ...form, cuestionario_id: cuestionario.id };
    const resultado = modalPregunta?.id
      ? await institucionService.actualizarPregunta(modalPregunta.id, payload)
      : await institucionService.crearPregunta(payload);
    if (resultado.success) { setModalPregunta(null); cargarPreguntas(); }
    return resultado;
  };

  const eliminarPregunta = async (id) => {
    if (!confirm('¿Eliminar esta pregunta?')) return;
    await institucionService.eliminarPregunta(id);
    cargarPreguntas();
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ cursor: 'pointer', flex: 1 }} onClick={() => setExpandido(e => !e)}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{cuestionario.nombre} <span style={{ color: 'var(--ink-soft)', fontWeight: 400 }}>v{cuestionario.version}</span></div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>{cuestionario.num_preguntas} pregunta(s)</div>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999, marginRight: 10,
          background: cuestionario.activo ? 'var(--primary-soft)' : 'var(--surface-2)',
          color: cuestionario.activo ? 'var(--primary-deep)' : 'var(--ink-soft)',
        }}>
          {cuestionario.activo ? 'Activo' : 'Inactivo'}
        </span>
        <button onClick={() => onActivar(cuestionario)} style={{ ...btnGhost, marginRight: 10 }}>
          {cuestionario.activo ? 'Desactivar' : 'Activar'}
        </button>
        <button onClick={() => onEliminar(cuestionario)} style={{ ...btnGhost, color: '#dc2626' }}>Eliminar</button>
      </div>

      {expandido && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
          {cargandoPreguntas ? (
            <p style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>Cargando preguntas…</p>
          ) : preguntas.length === 0 ? (
            <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 8 }}>Sin preguntas todavía.</p>
          ) : (
            preguntas.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ fontSize: 12.5 }}>{p.texto} <span style={{ color: 'var(--ink-soft)' }}>({p.opciones?.length || 0} opciones)</span></span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setModalPregunta(p)} style={{ ...btnGhost, fontSize: 11.5 }}>Editar</button>
                  <button onClick={() => eliminarPregunta(p.id)} style={{ ...btnGhost, color: '#dc2626', fontSize: 11.5 }}>Eliminar</button>
                </div>
              </div>
            ))
          )}
          <button onClick={() => setModalPregunta({})} style={{ ...btnGhost, fontSize: 12, marginTop: 8 }}>+ Agregar pregunta</button>
        </div>
      )}

      {modalPregunta !== null && (
        <ModalPregunta
          pregunta={modalPregunta.id ? modalPregunta : null}
          onGuardar={guardarPregunta}
          onCerrar={() => setModalPregunta(null)}
        />
      )}
    </div>
  );
}

export default function Cuestionarios({ user }) {
  const [perfil, setPerfil] = useState(null);
  const [cuestionarios, setCuestionarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [form, setForm] = useState({ nombre: '', version: '1.0', descripcion: '' });
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    const { success, data } = await institucionService.getCuestionarios();
    if (success) setCuestionarios(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user?.id) obtenerPerfil(user.id).then(({ success, data }) => { if (success) setPerfil(data); });
  }, [user?.id]);

  useEffect(() => { cargar(); }, [cargar]);

  const crear = async () => {
    if (!form.nombre.trim() || !form.version.trim()) { setError('Nombre y versión son obligatorios'); return; }
    const { success, error: err } = await institucionService.createCuestionario(form);
    if (!success) { setError(err); return; }
    setModalNuevo(false);
    setForm({ nombre: '', version: '1.0', descripcion: '' });
    cargar();
  };

  const activar = async (c) => {
    await institucionService.actualizarCuestionario(c.id, { nombre: c.nombre, version: c.version, descripcion: c.descripcion, activo: !c.activo });
    cargar();
  };

  const eliminar = async (c) => {
    if (!confirm(`¿Eliminar "${c.nombre}"? Se borran también sus preguntas.`)) return;
    await institucionService.eliminarCuestionario(c.id);
    cargar();
  };

  return (
    <DashboardLayout profile={perfil}>
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '28px 28px 60px' }}>
        <h1 className="font-display" style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
          Cuestionarios propios
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 16 }}>
          Si activás uno, tus estudiantes toman ESTE test en vez del general de Brota. Los demás usuarios no se ven afectados.
        </p>

        <InstitucionNav />

        <button onClick={() => { setForm({ nombre: '', version: '1.0', descripcion: '' }); setError(''); setModalNuevo(true); }} style={{ ...btnPrimary, marginBottom: 14 }}>
          + Nuevo cuestionario
        </button>

        {loading ? (
          <p style={{ color: 'var(--ink-soft)', fontSize: 14 }} className="animate-pulse">Cargando…</p>
        ) : cuestionarios.length === 0 ? (
          <div style={cardStyle}><p style={{ fontSize: 13.5 }}>Todavía no creaste ningún cuestionario propio.</p></div>
        ) : (
          cuestionarios.map(c => (
            <CuestionarioCard key={c.id} cuestionario={c} onActivar={activar} onEliminar={eliminar} />
          ))
        )}

        {modalNuevo && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ background: 'var(--surface)', borderRadius: 18, padding: 22, width: 440 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>Nuevo cuestionario</h2>
              <div style={{ display: 'grid', gap: 10, marginBottom: 12 }}>
                <input placeholder="Nombre" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} style={inputStyle} />
                <input placeholder="Versión (ej. 1.0)" value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} style={inputStyle} />
                <textarea rows={2} placeholder="Descripción (opcional)" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              {error && <p style={{ fontSize: 12, color: '#dc2626', marginBottom: 8 }}>{error}</p>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button onClick={() => setModalNuevo(false)} style={{ ...btnGhost, padding: '8px 12px' }}>Cancelar</button>
                <button onClick={crear} style={btnPrimary}>Crear</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
