import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/Layout/DashboardLayout';
import InstitucionNav from './components/InstitucionNav';
import { obtenerPerfil, actualizarPerfil } from '../../../services/perfilService';

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 10,
  border: '1px solid var(--line)', background: 'var(--surface)',
  color: 'var(--ink)', fontSize: 13.5, fontFamily: 'inherit',
};

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: 'var(--ink-soft)', marginBottom: 5,
};

const cardStyle = {
  background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20,
  padding: '24px 26px', marginBottom: 18,
};

function Campo({ label, value, onChange, type = 'text', textarea = false }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {textarea
        ? <textarea rows={3} value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} style={inputStyle} />}
    </div>
  );
}

function Dato({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13, padding: '7px 0', borderBottom: '1px solid var(--line)' }}>
      <span style={{ color: 'var(--ink-soft)' }}>{label}</span>
      <span style={{ fontWeight: 600, color: value ? 'var(--ink)' : 'var(--ink-soft)', textAlign: 'right' }}>{value || '—'}</span>
    </div>
  );
}

// Doble función: "perfil" de la institución (datos oficiales del catálogo,
// solo lectura, los administra un admin) + el cuestionario propio que la
// cuenta completa después del alta (contacto, teléfono, descripción) —
// ver CLAUDE.md sección de roles.
export default function PerfilInstitucion({ user }) {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ institucion_contacto: '', telefono: '', institucion_descripcion: '' });
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    obtenerPerfil(user.id).then(({ success, data }) => {
      if (success) {
        setPerfil(data);
        setForm({
          institucion_contacto:    data.institucion_contacto    || '',
          telefono:                data.telefono                || '',
          institucion_descripcion: data.institucion_descripcion || '',
        });
      }
      setLoading(false);
    });
  }, [user?.id]);

  async function guardarCuestionario() {
    setMsg(null);
    if (!form.institucion_contacto || !form.telefono) {
      setMsg({ tipo: 'error', texto: 'Nombre de contacto y teléfono son obligatorios.' });
      return;
    }
    setGuardando(true);
    const { success, error } = await actualizarPerfil(user.id, form);
    setGuardando(false);
    setMsg(
      success
        ? { tipo: 'ok', texto: 'Cambios guardados.' }
        : { tipo: 'error', texto: error || 'No se pudo guardar. Intentá de nuevo.' }
    );
  }

  const institucion = perfil?.institucion;

  return (
    <DashboardLayout profile={perfil}>
      <div style={{ maxWidth: 620, margin: '0 auto', padding: '28px 28px 60px' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14,
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            color: 'var(--ink-soft)', fontSize: 13, fontWeight: 600, padding: 0,
          }}
        >
          ← Volver
        </button>

        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
          Mi institución
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 16 }}>
          Estos datos son los que ven los estudiantes en Brota.
        </p>

        <InstitucionNav />

        {loading ? (
          <p style={{ color: 'var(--ink-soft)', fontSize: 14 }} className="animate-pulse">Cargando…</p>
        ) : !perfil?.institucion_id ? (
          <div style={cardStyle}>
            <p style={{ fontSize: 13.5, color: 'var(--ink)' }}>
              Tu cuenta todavía no está vinculada a ninguna institución del catálogo.
              Contactá a un administrador para que la vincule desde el panel.
            </p>
          </div>
        ) : (
          <>
            <div style={cardStyle}>
              <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Datos oficiales</h2>
              <p style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginBottom: 12 }}>
                Vienen del catálogo del Ministerio de Educación — si algo está mal, avisale a un administrador.
              </p>
              <Dato label="Nombre"       value={institucion?.nombre} />
              <Dato label="Tipo"         value={institucion?.tipo} />
              <Dato label="Ciudad"       value={[institucion?.ciudad, institucion?.departamento].filter(Boolean).join(', ')} />
              <Dato label="Dirección"    value={institucion?.direccion} />
              <Dato label="Sitio web"    value={institucion?.sitio_web} />
            </div>

            <div style={cardStyle}>
              <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Cuestionario de contacto</h2>
              <p style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginBottom: 14 }}>
                Esta información la administra tu institución directamente.
              </p>
              <div style={{ display: 'grid', gap: 14, marginBottom: 14 }}>
                <Campo
                  label="Nombre de la persona de contacto"
                  value={form.institucion_contacto}
                  onChange={v => setForm(f => ({ ...f, institucion_contacto: v }))}
                />
                <Campo
                  label="Teléfono de contacto"
                  value={form.telefono}
                  onChange={v => setForm(f => ({ ...f, telefono: v }))}
                />
                <Campo
                  label="Descripción breve (se muestra a los estudiantes)"
                  value={form.institucion_descripcion}
                  onChange={v => setForm(f => ({ ...f, institucion_descripcion: v }))}
                  textarea
                />
              </div>
              <button
                onClick={guardarCuestionario}
                disabled={guardando}
                style={{
                  background: 'var(--primary)', color: 'var(--primary-ink)', fontWeight: 700,
                  fontSize: 13, padding: '9px 18px', borderRadius: 10, border: 'none',
                  cursor: 'pointer', opacity: guardando ? 0.6 : 1, fontFamily: 'inherit',
                }}
              >
                {guardando ? 'Guardando…' : 'Guardar cambios'}
              </button>
              {msg && (
                <p style={{ fontSize: 12.5, marginTop: 10, color: msg.tipo === 'ok' ? 'var(--primary)' : '#dc2626' }}>
                  {msg.texto}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
