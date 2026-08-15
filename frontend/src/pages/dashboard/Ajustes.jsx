import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { obtenerPerfil, actualizarPerfil } from '../../services/perfilService';
import { updatePassword } from '../../services/authService';
import { handleLogout } from '../../utils/auth';

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

export default function Ajustes({ user, isDemoMode = false }) {
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [form, setForm] = useState({ nombre: '', apellido: '', ciudad: '', edad: '', nivel_educativo: '' });
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [perfilMsg, setPerfilMsg] = useState(null);

  const [passwords, setPasswords] = useState({ nueva: '', confirmar: '' });
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

  async function cambiarPassword() {
    setPasswordMsg(null);
    if (passwords.nueva.length < 6) {
      setPasswordMsg({ tipo: 'error', texto: 'La contraseña debe tener mínimo 6 caracteres.' });
      return;
    }
    if (passwords.nueva !== passwords.confirmar) {
      setPasswordMsg({ tipo: 'error', texto: 'Las contraseñas no coinciden.' });
      return;
    }
    setGuardandoPassword(true);
    const { success, error } = await updatePassword(passwords.nueva);
    setGuardandoPassword(false);
    if (!success) {
      setPasswordMsg({ tipo: 'error', texto: error || 'No se pudo cambiar la contraseña.' });
      return;
    }
    setPasswords({ nueva: '', confirmar: '' });
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
                <Campo label="Ciudad" value={form.ciudad} onChange={v => setForm(f => ({ ...f, ciudad: v }))} />
                <Campo label="Edad" type="number" value={form.edad} onChange={v => setForm(f => ({ ...f, edad: v }))} />
                <div style={{ gridColumn: '1 / -1' }}>
                  <Campo label="Nivel educativo" value={form.nivel_educativo} onChange={v => setForm(f => ({ ...f, nivel_educativo: v }))} />
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

            <Card icono="/icons/icon-seguridad.svg" titulo="Seguridad">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <Campo label="Nueva contraseña" type="password" value={passwords.nueva} onChange={v => setPasswords(p => ({ ...p, nueva: v }))} />
                <Campo label="Confirmar contraseña" type="password" value={passwords.confirmar} onChange={v => setPasswords(p => ({ ...p, confirmar: v }))} />
              </div>
              <button
                onClick={cambiarPassword}
                disabled={guardandoPassword || isDemoMode}
                style={{
                  background: 'var(--surface-2)', color: 'var(--ink)', fontWeight: 700,
                  fontSize: 13, padding: '9px 18px', borderRadius: 10, border: '1px solid var(--line)',
                  cursor: isDemoMode ? 'not-allowed' : 'pointer', opacity: guardandoPassword || isDemoMode ? 0.6 : 1,
                  fontFamily: 'inherit',
                }}
              >
                {guardandoPassword ? 'Cambiando…' : 'Cambiar contraseña'}
              </button>
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
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
