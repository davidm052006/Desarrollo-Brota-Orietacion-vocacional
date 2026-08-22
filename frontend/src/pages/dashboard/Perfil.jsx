import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import GlassSelect from '../../components/Shared/GlassSelect';
import BrotiAvatar from '../../components/Shared/BrotiAvatar';
import { obtenerPerfil, actualizarPerfil } from '../../services/perfilService';
import { CIUDADES_COLOMBIA } from '../../utils/ciudadesColombia';
import { calcularEdad } from '../../utils/calcularEdad';

const NIVELES_EDUCATIVOS = ['Educación media', 'Técnico', 'Tecnólogo', 'Universitario', 'Posgrado'];

const MESES = [
  { value: '1', label: 'Enero' }, { value: '2', label: 'Febrero' }, { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' }, { value: '5', label: 'Mayo' }, { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' }, { value: '8', label: 'Agosto' }, { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' }, { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' },
];

const ANIO_ACTUAL = new Date().getFullYear();
// Mismo rango 14–100 años que valida el backend (CHECK de perfiles_usuario)
const ANIOS = Array.from({ length: 87 }, (_, i) => String(ANIO_ACTUAL - 14 - i));

// Cuántos días tiene el mes elegido (considera bisiestos si ya hay año elegido)
function diasEnMes(mes, anio) {
  if (!mes) return 31;
  return new Date(Number(anio) || 2024, Number(mes), 0).getDate();
}

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 10,
  border: '1px solid var(--line)', background: 'var(--surface)',
  color: 'var(--ink)', fontSize: 13.5, fontFamily: 'inherit',
};

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: 'var(--ink-soft)', marginBottom: 5,
};

function Campo({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} style={inputStyle} />
    </div>
  );
}

function Mensaje({ estado }) {
  if (!estado) return null;
  return (
    <p style={{ fontSize: 12.5, marginTop: 10, color: estado.tipo === 'ok' ? 'var(--primary)' : '#dc2626' }}>
      {estado.texto}
    </p>
  );
}

export default function Perfil({ user, isDemoMode = false }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [form, setForm] = useState({ nombre: '', apellido: '', ciudad: '', edad: '', nivel_educativo: '' });
  const [fechaNac, setFechaNac] = useState({ dia: '', mes: '', anio: '' });
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    obtenerPerfil(user.id).then(({ success, data }) => {
      if (success) {
        setProfile(data);
        setForm({
          nombre: data.nombre || '',
          apellido: data.apellido || '',
          ciudad: data.ciudad || '',
          nivel_educativo: data.nivel_educativo || '',
        });
        // Antes solo se guardaba la edad, no la fecha exacta — si ya tenía
        // edad cargada, solo podemos estimar el año, día y mes quedan vacíos.
        if (data.edad) {
          setFechaNac(f => ({ ...f, anio: String(ANIO_ACTUAL - data.edad) }));
        }
      }
      setLoadingProfile(false);
    });
  }, [user?.id]);

  // Edad derivada de los 3 selects de fecha (misma fórmula que
  // backend/src/controllers/authController.js en el registro) — si todavía
  // no se tocó la fecha, cae a la edad ya guardada en el perfil.
  const edadCalculada = calcularEdad(fechaNac.dia, fechaNac.mes, fechaNac.anio) ?? profile?.edad ?? null;

  async function guardarPerfil() {
    setMsg(null);

    const tocoFecha = fechaNac.dia || fechaNac.mes || fechaNac.anio;
    if (tocoFecha && (!fechaNac.dia || !fechaNac.mes || !fechaNac.anio)) {
      setMsg({ tipo: 'error', texto: 'Completá día, mes y año de nacimiento.' });
      return;
    }
    if (edadCalculada && (edadCalculada < 14 || edadCalculada > 100)) {
      setMsg({ tipo: 'error', texto: 'La fecha de nacimiento da una edad fuera de 14–100 años.' });
      return;
    }

    setGuardando(true);
    const { success, error } = await actualizarPerfil(user.id, { ...form, edad: edadCalculada });
    setGuardando(false);
    setMsg(
      success
        ? { tipo: 'ok', texto: 'Cambios guardados.' }
        : { tipo: 'error', texto: error || 'No se pudo guardar. Intentá de nuevo.' }
    );
  }

  const profileFull = { ...profile, email: user?.email };

  return (
    <DashboardLayout profile={profileFull} isDemoMode={isDemoMode}>
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
          Mi perfil
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 22 }}>
          Estos datos ayudan a personalizar tus recomendaciones.
        </p>

        {loadingProfile ? (
          <p style={{ color: 'var(--ink-soft)', fontSize: 14 }} className="animate-pulse">Cargando…</p>
        ) : (
          <>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20,
            padding: '18px 22px', marginBottom: 18,
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <BrotiAvatar config={profile?.broti_config} size={64} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>Tu foto de perfil es Broti</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>
                Se ve así en tu cuenta y en tus publicaciones de comunidad (si no son anónimas).
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard/broti')}
              style={{
                background: 'var(--primary-soft)', color: 'var(--primary-deep)',
                fontWeight: 700, fontSize: 12.5, padding: '9px 16px', borderRadius: 10,
                border: 'none', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, whiteSpace: 'nowrap',
              }}
            >
              Personalizar →
            </button>
          </div>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20,
            padding: '24px 26px',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <Campo label="Nombre" value={form.nombre} onChange={v => setForm(f => ({ ...f, nombre: v }))} />
              <Campo label="Apellido" value={form.apellido} onChange={v => setForm(f => ({ ...f, apellido: v }))} />
              <div>
                <label style={labelStyle}>Ciudad</label>
                <GlassSelect
                  value={form.ciudad}
                  onChange={v => setForm(f => ({ ...f, ciudad: v }))}
                  options={CIUDADES_COLOMBIA}
                  placeholder="Elegir ciudad"
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Fecha de nacimiento</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 1fr', gap: 8 }}>
                  <GlassSelect
                    value={fechaNac.dia}
                    onChange={v => setFechaNac(f => ({ ...f, dia: v }))}
                    options={Array.from({ length: diasEnMes(fechaNac.mes, fechaNac.anio) }, (_, i) => String(i + 1))}
                    placeholder="Día"
                  />
                  <GlassSelect
                    value={fechaNac.mes}
                    onChange={v => setFechaNac(f => ({ ...f, mes: v, dia: '' }))}
                    options={MESES}
                    placeholder="Mes"
                  />
                  <GlassSelect
                    value={fechaNac.anio}
                    onChange={v => setFechaNac(f => ({ ...f, anio: v }))}
                    options={ANIOS}
                    placeholder="Año"
                  />
                </div>
                {edadCalculada != null && (
                  <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 6 }}>
                    Eso te da {edadCalculada} años.
                  </p>
                )}
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Nivel educativo</label>
                <GlassSelect
                  value={form.nivel_educativo}
                  onChange={v => setForm(f => ({ ...f, nivel_educativo: v }))}
                  options={NIVELES_EDUCATIVOS}
                  placeholder="Elegir nivel educativo"
                />
              </div>
            </div>
            <button
              onClick={guardarPerfil}
              disabled={guardando || isDemoMode}
              style={{
                background: 'var(--primary)', color: 'var(--primary-ink)', fontWeight: 700,
                fontSize: 13, padding: '9px 18px', borderRadius: 10, border: 'none',
                cursor: isDemoMode ? 'not-allowed' : 'pointer', opacity: guardando || isDemoMode ? 0.6 : 1,
                fontFamily: 'inherit',
              }}
            >
              {guardando ? 'Guardando…' : 'Guardar cambios'}
            </button>
            {isDemoMode && <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 10 }}>No disponible en modo demo.</p>}
            <Mensaje estado={msg} />
          </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
