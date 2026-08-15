import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useDarkMode } from '../../hooks/useDarkMode';
import LoginCard from './components/LoginCard';
import SignupCard from './components/SignupCard';
import ForgotPasswordCard from './components/ForgotPasswordCard';

// ─── Logo de marca ────────────────────────────────────────────────────────────
function BrotaLogo({ size = 58 }) {
  return (
    <img src="/logo-brota.png" alt="Brota" style={{ height: size, width: 'auto' }} />
  );
}

// ─── Lados de marca ───────────────────────────────────────────────────────────
function LoginHero() {
  return (
    <div style={{ maxWidth: 440 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <BrotaLogo />
        <span className="font-display" style={{ fontWeight: 800, fontSize: 46, color: 'var(--primary)', letterSpacing: -1 }}>BROTA</span>
      </div>
      <div className="font-display" style={{ fontWeight: 800, fontSize: 32, marginTop: 26, lineHeight: 1.1, color: 'var(--ink)' }}>
        Tu camino sigue justo donde lo dejaste.
      </div>
      <div style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 14, lineHeight: 1.55 }}>
        Vuelve a explorar profesiones, retomar tu test y descubrir lo que sigue para tu futuro.
      </div>
    </div>
  );
}

function SignupHero() {
  const FEATURES = [
    { icon: '✅', tint: 'var(--primary-soft)', text: 'Test vocacional 100% gratuito' },
    { icon: '🧭', tint: 'var(--accent-soft)',  text: '7.000+ programas disponibles'  },
    { icon: '🔒', tint: 'var(--primary-soft)', text: 'Tus datos siempre protegidos'  },
  ];

  return (
    <div style={{ maxWidth: 430 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <BrotaLogo size={52} />
        <span className="font-display" style={{ fontWeight: 800, fontSize: 44, color: 'var(--primary)', letterSpacing: -1 }}>BROTA</span>
      </div>
      <div className="font-display" style={{ fontWeight: 800, fontSize: 30, marginTop: 24, lineHeight: 1.1, color: 'var(--ink)' }}>
        Crea tu cuenta y empieza a <span style={{ color: 'var(--primary)' }}>crecer.</span>
      </div>
      <div style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 14, lineHeight: 1.55 }}>
        Orientación vocacional pensada para ti, desde grado 9° hasta la especialización profesional.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 26 }}>
        {FEATURES.map(({ icon, tint, text }) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 11, fontSize: 14, fontWeight: 600 }}>
            <span style={{
              width: 30, height: 30, borderRadius: 9, background: tint,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>{icon}</span>
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}

function ForgotHero() {
  return (
    <div style={{ maxWidth: 440 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <BrotaLogo />
        <span className="font-display" style={{ fontWeight: 800, fontSize: 46, color: 'var(--primary)', letterSpacing: -1 }}>BROTA</span>
      </div>
      <div className="font-display" style={{ fontWeight: 800, fontSize: 32, marginTop: 26, lineHeight: 1.1, color: 'var(--ink)' }}>
        Recupera el acceso a tu cuenta.
      </div>
      <div style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 14, lineHeight: 1.55 }}>
        Te enviaremos un correo con las instrucciones para restablecer tu contraseña.
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
function Login() {
  const [dark, toggleDark] = useDarkMode();

  const {
    mode, email, password, confirmPassword,
    primerNombre, segundoNombre, primerApellido, segundoApellido,
    nivelEducativo, grado, edad, ciudad, telefono, termsAccepted,
    loading, error, successMessage, validationErrors,
    onPrimerNombreChange, onSegundoNombreChange,
    onPrimerApellidoChange, onSegundoApellidoChange,
    onEmailChange,
    onPasswordChange, onConfirmPasswordChange,
    onNivelEducativoChange, onGradoChange, onEdadChange,
    onCiudadChange, onTelefonoChange, onTermsAcceptedChange,
    handleLogin, handleSignup, handlePasswordRecovery,
    changeMode,
  } = useAuth();

  const heroMap = {
    login:          <LoginHero />,
    signup:         <SignupHero />,
    forgotPassword: <ForgotHero />,
  };

const cardMap = {
  signup: (
    <SignupCard
      primerNombre={primerNombre}
      segundoNombre={segundoNombre}
      primerApellido={primerApellido}
      segundoApellido={segundoApellido}
      email={email}
      password={password}
      confirmPassword={confirmPassword}
      nivelEducativo={nivelEducativo}
      grado={grado}
      edad={edad}
      ciudad={ciudad}
      telefono={telefono}
      termsAccepted={termsAccepted}
      onTermsAcceptedChange={onTermsAcceptedChange}
      validationErrors={validationErrors}
      error={error}
      loading={loading}
      onPrimerNombreChange={onPrimerNombreChange}
      onSegundoNombreChange={onSegundoNombreChange}
      onPrimerApellidoChange={onPrimerApellidoChange}
      onSegundoApellidoChange={onSegundoApellidoChange}
      onEmailChange={onEmailChange}
      onPasswordChange={onPasswordChange}
      onConfirmPasswordChange={onConfirmPasswordChange}
      onNivelEducativoChange={onNivelEducativoChange}
      onGradoChange={onGradoChange}
      onEdadChange={onEdadChange}
      onCiudadChange={onCiudadChange}
      onTelefonoChange={onTelefonoChange}
      onSubmit={handleSignup}
      onSwitchToLogin={() => changeMode('login')}
    />
  ),
  forgotPassword: (
    <ForgotPasswordCard
      onSwitchToLogin={() => changeMode('login')}
    />
  ),
  login: (
    <LoginCard
      email={email}
      password={password}
      validationErrors={validationErrors}
      error={error}
      loading={loading}
      onEmailChange={onEmailChange}
      onPasswordChange={onPasswordChange}
      onSubmit={handleLogin}
      onSwitchToSignup={() => changeMode('signup')}
      onSwitchToForgotPassword={() => changeMode('forgotPassword')}
    />
  ),
};


  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}>

      {/* Toggle dark flotante */}
      <button
        onClick={toggleDark}
        title={dark ? 'Modo claro' : 'Modo oscuro'}
        style={{
          position: 'fixed', top: 16, right: 16, zIndex: 50,
          width: 38, height: 38, borderRadius: 11,
          background: 'var(--surface-2)', border: '1px solid var(--line)',
          cursor: 'pointer', fontSize: 15,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {dark ? '☀️' : '🌙'}
      </button>

      {/* Contenido */}
      <main style={{
        flex: 1, display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        alignItems: 'center',
        padding: '48px 56px', gap: 40,
      }}>
        {/* Brand side */}
        <div>{heroMap[mode] ?? heroMap.login}</div>

        {/* Form side */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {cardMap[mode] ?? cardMap.login}
        </div>
      </main>

      {/* Footer */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, var(--primary), var(--accent))' }} />
      <footer style={{
        background: 'var(--surface)', borderTop: '1px solid var(--line)',
        padding: '20px 56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <path d="M16 31 V15" stroke="var(--primary)" strokeWidth="2.6"/>
              <path d="M16 18 C16 11 9 8.5 4.5 8.5 C4.5 16 10 19 16 19 Z" fill="var(--primary)"/>
            </svg>
            <span className="font-display" style={{ fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>BROTA</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 3 }}>
            Orientación vocacional para tu futuro
          </div>
        </div>
        <nav style={{ display: 'flex', gap: 24, fontSize: 13, color: 'var(--ink-soft)', fontWeight: 600 }}>
          <Link to="/"           style={{ color: 'var(--ink-soft)', textDecoration: 'none' }}>Inicio</Link>
          <Link to="/contacto"   style={{ color: 'var(--ink-soft)', textDecoration: 'none' }}>Contacto</Link>
          <Link to="/privacidad" style={{ color: 'var(--ink-soft)', textDecoration: 'none' }}>Privacidad</Link>
          <Link to="/terminos"   style={{ color: 'var(--ink-soft)', textDecoration: 'none' }}>Términos</Link>
        </nav>
        <div style={{ fontSize: 15, color: 'var(--ink-soft)', display: 'flex', gap: 12 }}>
          📷 💼 ✖
        </div>
      </footer>

    </div>
  );
}

export default Login;
