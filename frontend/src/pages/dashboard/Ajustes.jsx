import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import GlassSelect from '../../components/Shared/GlassSelect';
import { obtenerPerfil, actualizarPerfil } from '../../services/perfilService';
import { sendPasswordReset, verifyOtpAndUpdatePassword } from '../../services/authService';
import { handleLogout } from '../../utils/auth';
import { CIUDADES_COLOMBIA } from '../../utils/ciudadesColombia';
import { useFontFamily, FUENTES } from '../../hooks/useFontFamily';

const EDADES = Array.from({ length: 87 }, (_, i) => String(14 + i)); // 14–100, mismo rango del CHECK en perfiles_usuario
const NIVELES_EDUCATIVOS = ['Educación media', 'Técnico', 'Tecnólogo', 'Universitario', 'Posgrado'];

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

function Card({ icono, titulo, children }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20,
      padding: '24px 26px', marginBottom: 18,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <img src={icono} alt="" style={{ width: 19, height: 19 }} />
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{titulo}</h2>
      </div>
      {children}
    </div>
  );
}

// Fila deshabilitada para configuraciones futuras — visible para que no se
// olviden, pero sin funcionalidad real todavía.
function FilaProvisional({ titulo, descripcion }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 14, padding: '12px 0', borderBottom: '1px solid var(--line)', opacity: 0.55,
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{titulo}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>{descripcion}</div>
      </div>
      <span style={{
        flexShrink: 0, fontSize: 10.5, fontWeight: 700, color: 'var(--ink-soft)',
        background: 'var(--surface-2)', padding: '3px 9px', borderRadius: 999,
      }}>
        Próximamente
      </span>
    </div>
  );
}

export default function Ajustes({ user, isDemoMode = false }) {
  const [fuente, setFuente] = useFontFamily();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [form, setForm] = useState({ nombre: '', apellido: '', ciudad: '', edad: '', nivel_educativo: '' });
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [perfilMsg, setPerfilMsg] = useState(null);

  const [passwords, setPasswords] = useState({ nueva: '', confirmar: '' });
  const [codigo, setCodigo] = useState('');
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [enviandoCodigo, setEnviandoCodigo] = useState(false);
  const [guardandoPassword, setGuardandoPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    obtenerPerfil(user.id).then(({ success, data }) => {
      if (success) {
        setProfile(data);
        setForm({
          nombre: data.nombre || '',
          apellido: data.apellido || '',
          ciudad: data.ciudad || '',
          edad: data.edad || '',
          nivel_educativo: data.nivel_educativo || '',
        });
      }
      setLoadingProfile(false);
    });
  }, [user?.id]);

  async function guardarPerfil() {
    setGuardandoPerfil(true);
    setPerfilMsg(null);
    const { success, error } = await actualizarPerfil(user.id, form);
    setGuardandoPerfil(false);
    setPerfilMsg(
      success
        ? { tipo: 'ok', texto: 'Cambios guardados.' }
        : { tipo: 'error', texto: error || 'No se pudo guardar. Intentá de nuevo.' }
    );
  }

  async function enviarCodigo() {
    setPasswordMsg(null);
    setEnviandoCodigo(true);
    const { success, error } = await sendPasswordReset(user.email);
    setEnviandoCodigo(false);
    if (!success) {
      setPasswordMsg({ tipo: 'error', texto: error || 'No se pudo enviar el código.' });
      return;
    }
    setCodigoEnviado(true);
    setPasswordMsg({ tipo: 'ok', texto: `Te enviamos un código de 8 dígitos a ${user.email}.` });
  }

  async function cambiarPassword() {
    setPasswordMsg(null);
    if (codigo.length < 8) {
      setPasswordMsg({ tipo: 'error', texto: 'Ingresá el código de 8 dígitos que te enviamos por correo.' });
      return;
    }
    if (passwords.nueva.length < 6) {
      setPasswordMsg({ tipo: 'error', texto: 'La contraseña debe tener mínimo 6 caracteres.' });
      return;
    }
    if (passwords.nueva !== passwords.confirmar) {
      setPasswordMsg({ tipo: 'error', texto: 'Las contraseñas no coinciden.' });
      return;
    }
    setGuardandoPassword(true);
    const { success, error } = await verifyOtpAndUpdatePassword(user.email, codigo, passwords.nueva);
    setGuardandoPassword(false);
    if (!success) {
      setPasswordMsg({ tipo: 'error', texto: error || 'No se pudo cambiar la contraseña.' });
      return;
    }
    setPasswords({ nueva: '', confirmar: '' });
    setCodigo('');
    setCodigoEnviado(false);
    setPasswordMsg({ tipo: 'ok', texto: 'Contraseña actualizada.' });
  }

  const profileFull = { ...profile, email: user?.email };

  return (
    <DashboardLayout profile={profileFull} isDemoMode={isDemoMode}>
      <div style={{ maxWidth: 620, margin: '0 auto', padding: '28px 28px 60px' }}>
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 800, marginBottom: 22 }}>
          Ajustes
        </h1>

        {loadingProfile ? (
          <p style={{ color: 'var(--ink-soft)', fontSize: 14 }} className="animate-pulse">Cargando…</p>
        ) : (
          <>
            <Card icono="/icons/icon-perfil.svg" titulo="Mi perfil">
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
                <div>
                  <label style={labelStyle}>Edad</label>
                  <GlassSelect
                    value={form.edad ? String(form.edad) : ''}
                    onChange={v => setForm(f => ({ ...f, edad: v }))}
                    options={EDADES}
                    placeholder="Elegir edad"
                  />
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
                disabled={guardandoPerfil || isDemoMode}
                style={{
                  background: 'var(--primary)', color: 'var(--primary-ink)', fontWeight: 700,
                  fontSize: 13, padding: '9px 18px', borderRadius: 10, border: 'none',
                  cursor: isDemoMode ? 'not-allowed' : 'pointer', opacity: guardandoPerfil || isDemoMode ? 0.6 : 1,
                  fontFamily: 'inherit',
                }}
              >
                {guardandoPerfil ? 'Guardando…' : 'Guardar cambios'}
              </button>
              {isDemoMode && <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 10 }}>No disponible en modo demo.</p>}
              <Mensaje estado={perfilMsg} />
            </Card>

            <Card icono="/icons/icon-apariencia.svg" titulo="Apariencia">
              <div style={{ maxWidth: 260 }}>
                <label style={labelStyle}>Tipo de letra</label>
                <GlassSelect
                  value={fuente}
                  onChange={setFuente}
                  options={Object.entries(FUENTES).map(([key, f]) => ({ value: key, label: f.label }))}
                  placeholder="Elegir tipo de letra"
                />
              </div>
              <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 10 }}>
                Se aplica en todo el panel y se guarda en este dispositivo.
              </p>
            </Card>

            <Card icono="/icons/icon-seguridad.svg" titulo="Seguridad">
              <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 14 }}>
                Por seguridad, para cambiar tu contraseña primero necesitás verificar tu correo con un código —
                el mismo método que usa "Olvidé mi contraseña".
              </p>

              {!codigoEnviado ? (
                <button
                  onClick={enviarCodigo}
                  disabled={enviandoCodigo || isDemoMode}
                  style={{
                    background: 'var(--surface-2)', color: 'var(--ink)', fontWeight: 700,
                    fontSize: 13, padding: '9px 18px', borderRadius: 10, border: '1px solid var(--line)',
                    cursor: isDemoMode ? 'not-allowed' : 'pointer', opacity: enviandoCodigo || isDemoMode ? 0.6 : 1,
                    fontFamily: 'inherit',
                  }}
                >
                  {enviandoCodigo ? 'Enviando…' : 'Enviar código de verificación'}
                </button>
              ) : (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <Campo
                      label="Código de 8 dígitos"
                      value={codigo}
                      onChange={v => setCodigo(v.replace(/\D/g, '').slice(0, 8))}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                    <Campo label="Nueva contraseña" type="password" value={passwords.nueva} onChange={v => setPasswords(p => ({ ...p, nueva: v }))} />
                    <Campo label="Confirmar contraseña" type="password" value={passwords.confirmar} onChange={v => setPasswords(p => ({ ...p, confirmar: v }))} />
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button
                      onClick={cambiarPassword}
                      disabled={guardandoPassword || codigo.length < 8 || isDemoMode}
                      style={{
                        background: 'var(--primary)', color: 'var(--primary-ink)', fontWeight: 700,
                        fontSize: 13, padding: '9px 18px', borderRadius: 10, border: 'none',
                        cursor: (codigo.length < 8 || isDemoMode) ? 'not-allowed' : 'pointer',
                        opacity: guardandoPassword || codigo.length < 8 || isDemoMode ? 0.4 : 1,
                        fontFamily: 'inherit',
                      }}
                    >
                      {guardandoPassword ? 'Cambiando…' : 'Cambiar contraseña'}
                    </button>
                    <button
                      onClick={enviarCodigo}
                      disabled={enviandoCodigo || isDemoMode}
                      style={{
                        background: 'none', color: 'var(--ink-soft)', fontWeight: 600,
                        fontSize: 12.5, padding: '9px 6px', borderRadius: 10, border: 'none',
                        cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline',
                      }}
                    >
                      Reenviar código
                    </button>
                  </div>
                </>
              )}
              {isDemoMode && <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 10 }}>No disponible en modo demo.</p>}
              <Mensaje estado={passwordMsg} />
            </Card>

            <Card icono="/icons/icon-cerrar-sesion.svg" titulo="Cuenta">
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 14 }}>
                Cerrá sesión en este dispositivo.
              </p>
              <button
                onClick={() => handleLogout(isDemoMode)}
                style={{
                  background: 'none', color: '#dc2626', fontWeight: 700,
                  fontSize: 13, padding: '9px 18px', borderRadius: 10, border: '1px solid #fca5a5',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Cerrar sesión
              </button>
            </Card>

            <Card icono="/icons/icon-ajustes.svg" titulo="Próximamente">
              <FilaProvisional titulo="Notificaciones por correo" descripcion="Avisos de respuestas a tus preguntas y nuevas convocatorias." />
              <FilaProvisional titulo="Perfil público en Comunidad" descripcion="Elegir si tu nombre real se muestra en vez de anónimo por defecto." />
              <FilaProvisional titulo="Tamaño de texto" descripcion="Accesibilidad — independiente del tipo de letra." />
              <FilaProvisional titulo="Exportar o eliminar mi cuenta" descripcion="Descargar tus datos o borrar la cuenta permanentemente." />
              <FilaProvisional titulo="Idioma" descripcion="Si Brota se traduce a otros idiomas en el futuro." />
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
