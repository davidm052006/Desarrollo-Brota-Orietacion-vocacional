import {useState} from 'react';
import AuthCardShell from './AuthCardShell';
import {sendPasswordReset, verifyOtpAndUpdatePassword} from '../../../services/authService';

const inputBase = {
  width: '100%', boxSizing: 'border-box',
  background: 'var(--surface-2)',
  borderRadius: 13, padding: '13px 15px',
  fontSize: 13.5, color: 'var(--ink)',
  outline: 'none', fontFamily: 'inherit',
};

const btnPrimary = {
  background: 'var(--primary)', color: 'var(--primary-ink)',
  fontWeight: 800, fontSize: 15, padding: 14,
  borderRadius: 13, border: 'none', cursor: 'pointer',
  boxShadow: '0 8px 20px var(--primary-glow)',
  width: '100%',
};

const errorStyle = { color: '#e53e3e', fontSize: 11, marginTop: 3 };

const alertStyle = (type) => ({
  background: type === 'success' ? 'var(--primary-soft)' : 'var(--accent-soft)',
  border: `1px solid ${type === 'success' ? 'var(--primary)' : 'var(--accent)'}`,
  color: type === 'success' ? 'var(--primary-deep)' : 'var(--accent)',
  borderRadius: 12, padding: '12px 16px', fontSize: 13,
});

function ForgotPasswordCard({ onSwitchToLogin }) {
  // ── Estado del flujo ───────────────────────────────────────
  const [paso, setPaso]               = useState(1); // 1 = correo | 2 = código + contraseña
  const [email, setEmail]             = useState('');
  const [codigo, setCodigo]           = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [success, setSuccess]         = useState(false);
  const [errors, setErrors]           = useState({});

  // ── Paso 1: enviar correo ──────────────────────────────────
  const handleEnviarCodigo = async (e) => {
    e.preventDefault();
    setError(null);
    setErrors({});

    if (!email) return setErrors({ email: 'El correo es requerido' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return setErrors({ email: 'Correo inválido' });

    setLoading(true);
    const res = await sendPasswordReset(email);
    setLoading(false);

    if (!res.success) return setError(res.error);
    setPaso(2);
  };

  // ── Paso 2: verificar OTP y cambiar contraseña ─────────────
  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    setError(null);
    const errs = {};

    if (!codigo || codigo.length < 8) errs.codigo = 'Ingresa el código de 8 dígitos';
    if (!password)                    errs.password = 'La contraseña es requerida';
    else if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password))
      errs.password = 'Mínimo 8 caracteres, con letras y números';
    if (password !== confirmPassword) errs.confirmPassword = 'Las contraseñas no coinciden';

    if (Object.keys(errs).length) return setErrors(errs);

    setLoading(true);
    const res = await verifyOtpAndUpdatePassword(email, codigo.trim(), password);
    setLoading(false);

    if (!res.success) return setError(res.error);
    setSuccess(true);
    setTimeout(() => onSwitchToLogin(), 3000);
  };

  // ── Render: éxito ──────────────────────────────────────────
  if (success) {
    return (
      <AuthCardShell title="¡Listo! 🎉" description="Tu contraseña fue actualizada.">
        <div style={alertStyle('success')}>
          Contraseña cambiada con éxito. Redirigiendo al inicio de sesión...
        </div>
      </AuthCardShell>
    );
  }

  // ── Render: Paso 1 — ingresar correo ──────────────────────
  if (paso === 1) {
    return (
      <AuthCardShell
        title="Recupera tu contraseña"
        description="Te enviaremos un código de 8 dígitos a tu correo."
      >
        {error && <div style={alertStyle('error')}>{error}</div>}

        <form onSubmit={handleEnviarCodigo} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div>
            <input
              placeholder="Escribe tu correo…"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors({}); }}
              style={{ ...inputBase, border: `1px solid ${errors.email ? '#e53e3e' : 'var(--line)'}` }}
            />
            {errors.email && <p style={errorStyle}>{errors.email}</p>}
          </div>

          <button type="submit" disabled={loading} style={{ ...btnPrimary, opacity: loading ? .6 : 1 }}>
            {loading ? 'Enviando…' : 'Enviar código'}
          </button>
        </form>

        <p style={{ fontSize: 13, textAlign: 'center', color: 'var(--ink-soft)' }}>
          ¿Recordaste tu contraseña?{' '}
          <button type="button" onClick={onSwitchToLogin}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 700, fontSize: 13 }}>
            Volver al inicio
          </button>
        </p>
      </AuthCardShell>
    );
  }

  // ── Render: Paso 2 — ingresar código + nueva contraseña ───
  return (
    <AuthCardShell
      title="Ingresa el código"
      description={`Enviamos un código de 8 dígitos a ${email}`}
    >
      {error && <div style={alertStyle('error')}>{error}</div>}

      <form onSubmit={handleCambiarPassword} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>

        {/* Campo del código OTP */}
        <div>
          <input
            placeholder="Código de 8 dígitos"
            value={codigo}
            onChange={(e) => {
              // Solo números, máximo 8 dígitos
              const val = e.target.value.replace(/\D/g, '').slice(0, 8);
              setCodigo(val);
              setErrors((prev) => ({ ...prev, codigo: '' }));
            }}
            maxLength={8}
            inputMode="numeric"
            style={{
              ...inputBase,
              border: `1px solid ${errors.codigo ? '#e53e3e' : 'var(--line)'}`,
              letterSpacing: '6px',
              fontSize: 16,
              fontWeight: 700,
              textAlign: 'center',
            }}
          />
          {errors.codigo && <p style={errorStyle}>{errors.codigo}</p>}
        </div>

        {/* Nueva contraseña */}
        <div>
          <input
            type="password"
            placeholder="Nueva contraseña"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); }}
            style={{ ...inputBase, border: `1px solid ${errors.password ? '#e53e3e' : 'var(--line)'}` }}
          />
          {errors.password && <p style={errorStyle}>{errors.password}</p>}
        </div>

        {/* Confirmar contraseña */}
        <div>
          <input
            type="password"
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, confirmPassword: '' })); }}
            style={{ ...inputBase, border: `1px solid ${errors.confirmPassword ? '#e53e3e' : 'var(--line)'}` }}
          />
          {errors.confirmPassword && <p style={errorStyle}>{errors.confirmPassword}</p>}
        </div>

        <button type="submit" disabled={loading} style={{ ...btnPrimary, opacity: loading ? .6 : 1 }}>
          {loading ? 'Verificando…' : 'Cambiar contraseña'}
        </button>
      </form>

      {/* Reenviar código */}
      <p style={{ fontSize: 12, textAlign: 'center', color: 'var(--ink-soft)' }}>
        ¿No llegó el código?{' '}
        <button type="button"
          onClick={() => { setPaso(1); setError(null); setCodigo(''); setPassword(''); setConfirmPassword(''); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 700, fontSize: 12 }}>
          Reenviar
        </button>
      </p>
    </AuthCardShell>
  );
}

export default ForgotPasswordCard;
