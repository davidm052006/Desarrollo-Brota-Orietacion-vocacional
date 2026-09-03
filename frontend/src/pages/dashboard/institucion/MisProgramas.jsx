import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/Layout/DashboardLayout';
import InstitucionNav from './components/InstitucionNav';
import { obtenerPerfil } from '../../../services/perfilService';
import { getMisProgramas, actualizarMiPrograma } from '../../../services/institucionService';

const cardStyle = {
  background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16,
  padding: '16px 18px', marginBottom: 12,
};

const inputStyle = {
  width: '100%', padding: '8px 10px', borderRadius: 9,
  border: '1px solid var(--line)', background: 'var(--bg)',
  color: 'var(--ink)', fontSize: 13, fontFamily: 'inherit',
};

// Solo lo que la institución puede editar de su propio programa —
// nombre/tipo/area_academica son dato oficial del MEN, no se tocan acá
// (ver backend/src/controllers/institucion/programasController.js).
function FilaPrograma({ programa, onGuardado }) {
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({
    descripcion: programa.descripcion || '',
    requisitos: programa.requisitos || '',
    costo_matricula: programa.costo_matricula || '',
    activo: programa.activo,
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  async function guardar() {
    setGuardando(true);
    setError(null);
    const { success, error: err } = await actualizarMiPrograma(programa.id, form);
    setGuardando(false);
    if (!success) { setError(err); return; }
    setEditando(false);
    onGuardado();
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{programa.nombre}</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>
            {programa.tipo} · {programa.area_academica || 'Sin área'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999,
            background: programa.activo ? 'var(--primary-soft)' : 'var(--surface-2)',
            color: programa.activo ? 'var(--primary-deep)' : 'var(--ink-soft)',
          }}>
            {programa.activo ? 'Activo' : 'Inactivo'}
          </span>
          <button
            onClick={() => setEditando(e => !e)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, color: 'var(--primary)', fontFamily: 'inherit' }}
          >
            {editando ? 'Cerrar' : 'Editar'}
          </button>
        </div>
      </div>

      {editando && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)', display: 'grid', gap: 10 }}>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: 4 }}>Descripción</label>
            <textarea rows={2} value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: 4 }}>Requisitos</label>
            <textarea rows={2} value={form.requisitos} onChange={e => setForm(f => ({ ...f, requisitos: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: 4 }}>Costo matrícula</label>
              <input type="number" value={form.costo_matricula} onChange={e => setForm(f => ({ ...f, costo_matricula: e.target.value }))} style={inputStyle} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, paddingBottom: 8 }}>
              <input type="checkbox" checked={form.activo} onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))} />
              Activo
            </label>
          </div>
          {error && <p style={{ fontSize: 12, color: '#dc2626' }}>{error}</p>}
          <button
            onClick={guardar}
            disabled={guardando}
            style={{
              justifySelf: 'start', background: 'var(--primary)', color: 'var(--primary-ink)', fontWeight: 700,
              fontSize: 12.5, padding: '7px 14px', borderRadius: 9, border: 'none',
              cursor: 'pointer', opacity: guardando ? 0.6 : 1, fontFamily: 'inherit',
            }}
          >
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function MisProgramas({ user }) {
  const [perfil, setPerfil] = useState(null);
  const [programas, setProgramas] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = () => {
    getMisProgramas().then(({ success, data }) => {
      if (success) setProgramas(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (user?.id) obtenerPerfil(user.id).then(({ success, data }) => { if (success) setPerfil(data); });
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <DashboardLayout profile={perfil}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '28px 28px 60px' }}>
        <h1 className="font-display" style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
          Mis programas
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 16 }}>
          Nombre, tipo y área son dato oficial del catálogo — solo podés editar descripción, requisitos, costo y si está activo.
        </p>

        <InstitucionNav />

        {loading ? (
          <p style={{ color: 'var(--ink-soft)', fontSize: 14 }} className="animate-pulse">Cargando…</p>
        ) : programas.length === 0 ? (
          <div style={cardStyle}>
            <p style={{ fontSize: 13.5, color: 'var(--ink)' }}>
              Todavía no hay programas de tu institución en el catálogo.
            </p>
          </div>
        ) : (
          programas.map(p => <FilaPrograma key={p.id} programa={p} onGuardado={cargar} />)
        )}
      </div>
    </DashboardLayout>
  );
}
