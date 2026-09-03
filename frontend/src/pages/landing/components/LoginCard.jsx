import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthCardShell from './AuthCardShell';

const inputStyle = (error) => ({
  width: '100%', boxSizing: 'border-box',
  background: 'var(--surface-2)',
  border: `1px solid ${error ? '#e53e3e' : 'var(--line)'}`,
  borderRadius: 13, padding: '13px 15px',
  fontSize: 13.5, color: 'var(--ink)',
  outline: 'none', fontFamily: 'inherit',
});

function FieldInput({ placeholder, value, onChange, error, type = 'text' }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative' }}>
        <input
          type={isPassword && !show ? 'password' : 'text'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete="off"
          style={inputStyle(error)}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--ink-soft)', fontSize: 15,
            }}
            tabIndex={-1}
          >
            {show ? '🙈' : '👁️'}
          </button>
        )}
      </div>
      {error && <p style={{ color: '#e53e3e', fontSize: 11, marginTop: 3 }}>{error}</p>}
    </div>
  );
}

function LoginCard({
  email, password, validationErrors, error, loading,
  onEmailChange, onPasswordChange, onSubmit,
  onSwitchToSignup, onSwitchToForgotPassword,
}) {
  return (
    <AuthCardShell title="Accede a tu cuenta" description="¡Qué bueno verte de nuevo! 🌱">
      {error && (
        <div style={{
          background: 'var(--accent-soft)', border: '1px solid var(--accent)',
          color: 'var(--accent)', borderRadius: 12, padding: '12px 16px', fontSize: 13,
        }}>
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        <FieldInput
          placeholder="Escribe tu correo…"
          value={email}
          onChange={onEmailChange}
          error={validationErrors.email}
        />
        <FieldInput
          placeholder="Contraseña…"
          type="password"
          value={password}
          onChange={onPasswordChange}
          error={validationErrors.password}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            background: 'var(--primary)', color: 'var(--primary-ink)',
            textAlign: 'center', fontWeight: 800, fontSize: 15,
            padding: 14, borderRadius: 13, border: 'none', cursor: 'pointer',
            boxShadow: '0 8px 20px var(--primary-glow)',
            opacity: loading ? .6 : 1, marginTop: 2,
          }}
        >
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
          ¿Aún no eres parte?{' '}
          <button type="button" onClick={onSwitchToSignup} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--primary)', fontWeight: 700, fontSize: 13,
          }}>
            Regístrate
          </button>
        </p>
        <button type="button" onClick={onSwitchToForgotPassword} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--primary)', fontWeight: 700, fontSize: 13,
        }}>
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      {/* Las cuentas institución no son de auto-registro (evita que alguien
          se registre suplantando una institución real) — este botón manda a
          un formulario de solicitud que revisa un admin, no crea la cuenta. */}
      <div style={{
        marginTop: 4, paddingTop: 14, borderTop: '1px solid var(--line)',
        textAlign: 'center',
      }}>
        <Link
          to="/contacto?asunto=institucion"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 12.5, fontWeight: 700, color: 'var(--ink-soft)', textDecoration: 'none',
          }}
        >
          🏫 ¿Sos una institución? Solicitá acceso →
        </Link>
      </div>
    </AuthCardShell>
  );
}

export default LoginCard;
