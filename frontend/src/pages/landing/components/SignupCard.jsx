import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthCardShell from './AuthCardShell';
import { CIUDADES_COLOMBIA } from '../../../utils/ciudadesColombia';

// ── Estilos base de campo ────────────────────────────────────────────────────
const fieldStyle = (error) => ({
  width: '100%', boxSizing: 'border-box',
  background: 'var(--surface-2)',
  border: `1px solid ${error ? '#e53e3e' : 'var(--line)'}`,
  borderRadius: 12, padding: '13px 15px',
  fontSize: 13.5, color: 'var(--ink)',
  outline: 'none', fontFamily: 'inherit', appearance: 'none',
});

// ── Input simple ─────────────────────────────────────────────────────────────
function Input({ placeholder, value, onChange, error, type = 'text' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete="off"
        style={fieldStyle(error)}
      />
      {error && <p style={{ color: '#e53e3e', fontSize: 11, marginTop: 3 }}>{error}</p>}
    </div>
  );
}

// ── Input contraseña ─────────────────────────────────────────────────────────
function PasswordInput({ placeholder, value, onChange, error }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete="new-password"
          onCopy={e => e.preventDefault()}
          onCut={e => e.preventDefault()}
          onPaste={e => e.preventDefault()}
          style={{ ...fieldStyle(error), paddingRight: 40 }}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          style={{
            position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--ink-soft)', fontSize: 15,
          }}
          tabIndex={-1}
        >
          {show ? '🙈' : '👁️'}
        </button>
      </div>
      {error && <p style={{ color: '#e53e3e', fontSize: 11, marginTop: 3 }}>{error}</p>}
    </div>
  );
}

// ── Autocomplete de ciudades ──────────────────────────────────────────────────
function CityAutocomplete({ value, onChange, error }) {
  const [isOpen, setIsOpen] = useState(false);
  const search = value.trim().toLowerCase();
  const suggestions = search
    ? CIUDADES_COLOMBIA.filter(c => c.toLowerCase().startsWith(search)).slice(0, 5)
    : [];

  const selectCity = (city) => {
    onChange({ target: { value: city } });
    setIsOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <input
        type="text"
        placeholder="Ciudad"
        value={value}
        onChange={e => { onChange(e); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 120)}
        autoComplete="off"
        style={fieldStyle(error)}
      />
      {isOpen && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', left: 0, right: 0, top: '100%', zIndex: 20,
          marginTop: 4, background: 'var(--surface)',
          border: '1px solid var(--line)', borderRadius: 12,
          boxShadow: 'var(--shadow)', overflow: 'hidden',
        }}>
          {suggestions.map(city => (
            <button
              key={city}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => selectCity(city)}
              style={{
                width: '100%', padding: '10px 15px', textAlign: 'left',
                fontSize: 13.5, color: 'var(--ink)', background: 'none', border: 'none',
                cursor: 'pointer', display: 'block',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-soft)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              {city}
            </button>
          ))}
        </div>
      )}
      {error && <p style={{ color: '#e53e3e', fontSize: 11, marginTop: 3 }}>{error}</p>}
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────────────────
function SelectField({ value, onChange, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <select value={value} onChange={onChange} style={fieldStyle(error)}>
        {children}
      </select>
      {error && <p style={{ color: '#e53e3e', fontSize: 11, marginTop: 3 }}>{error}</p>}
    </div>
  );
}

// ── SignupCard ────────────────────────────────────────────────────────────────
function SignupCard({
  primerNombre = '', primerApellido = '',
  email = '', password = '', confirmPassword = '',
  nivelEducativo = '', grado = '', edad = '', ciudad = '', telefono = '',
  termsAccepted = false,
  validationErrors = {}, error, loading,
  onPrimerNombreChange, onPrimerApellidoChange,
  onEmailChange, onPasswordChange, onConfirmPasswordChange,
  onNivelEducativoChange, onGradoChange, onEdadChange,
  onCiudadChange, onTelefonoChange, onTermsAcceptedChange,
  onSubmit, onSwitchToLogin,
}) {
  const getPasswordStrength = (pwd) => {
    if (!pwd || pwd.length === 0) return { label: '', score: 0 };
    if (pwd.length < 4)           return { label: 'Muy débil', score: 1, color: '#e53e3e' };
    if (pwd.length < 8)           return { label: 'Débil',     score: 2, color: '#dd6b20' };
    if (pwd.length < 12)          return { label: 'Media',     score: 3, color: '#d69e2e' };
    return                               { label: 'Fuerte',    score: 4, color: 'var(--primary)' };
  };

  const strength = getPasswordStrength(password);

  const formComplete =
    primerNombre.trim() !== '' && primerApellido.trim() !== '' &&
    email.trim() !== '' && password.trim() !== '' && confirmPassword.trim() !== '' &&
    nivelEducativo !== '' && grado !== '' &&
    edad.trim() !== '' && ciudad.trim() !== '' && telefono.trim() !== '' &&
    termsAccepted === true;

  const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 };

  return (
    <AuthCardShell title="Crea tu cuenta" description="Toma menos de 2 minutos.">

      {error && (
        <div style={{
          background: 'var(--accent-soft)', border: '1px solid var(--accent)',
          color: 'var(--accent)', borderRadius: 12, padding: '12px 16px', fontSize: 13,
        }}>
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 11 }} autoComplete="off">

        <Input placeholder="Nombres completos"  value={primerNombre}  onChange={onPrimerNombreChange}  error={validationErrors.primerNombre} />
        <Input placeholder="Apellidos completos" value={primerApellido} onChange={onPrimerApellidoChange} error={validationErrors.primerApellido} />
        <Input placeholder="Correo electrónico"  value={email}          onChange={onEmailChange}          error={validationErrors.email} />

        <div style={grid2}>
          <PasswordInput placeholder="Contraseña"           value={password}         onChange={onPasswordChange}        error={validationErrors.password} />
          <PasswordInput placeholder="Confirmar contraseña" value={confirmPassword}  onChange={onConfirmPasswordChange} error={validationErrors.confirmPassword} />
        </div>

        {/* Fortaleza contraseña */}
        {password && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 5, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{
                width: `${(strength.score / 4) * 100}%`, height: '100%',
                background: strength.color, borderRadius: 999, transition: 'width .3s',
              }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: strength.color, whiteSpace: 'nowrap' }}>
              {strength.label}
            </span>
          </div>
        )}

        <div style={grid2}>
          <SelectField value={nivelEducativo} onChange={e => onNivelEducativoChange(e.target.value)} error={validationErrors.nivelEducativo}>
            <option value="">Nivel educativo</option>
            <option value="Educacion media">Educación media</option>
            <option value="Tecnico">Técnico</option>
          </SelectField>
          <SelectField value={grado} onChange={e => onGradoChange(e.target.value)} error={validationErrors.grado}>
            <option value="">Grado</option>
            <option value="Noveno">Noveno</option>
            <option value="Décimo">Décimo</option>
            <option value="Once">Once</option>
          </SelectField>
        </div>

        <div style={grid2}>
          <Input placeholder="Fecha de nacimiento" type="date" value={edad} onChange={onEdadChange} error={validationErrors.edad} />
          <CityAutocomplete value={ciudad} onChange={onCiudadChange} error={validationErrors.ciudad} />
        </div>

        <Input placeholder="Número de teléfono" value={telefono} onChange={onTelefonoChange} error={validationErrors.telefono} />

        {/* Términos — siempre habilitado para que el usuario pueda leer y aceptar en cualquier momento */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 9,
          fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.4, marginTop: 3,
        }}>
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={onTermsAcceptedChange}
            style={{
              width: 18, height: 18, borderRadius: 5, flexShrink: 0,
              accentColor: 'var(--primary)', cursor: 'pointer', marginTop: 1,
            }}
          />
          <span>
            Acepto los{' '}
            <a href="/terminos" target="_blank" rel="noreferrer"
              style={{ color: 'var(--primary)', fontWeight: 700 }}>
              Términos y Condiciones
            </a>{' '}
            y la{' '}
            <a href="/privacidad" target="_blank" rel="noreferrer"
              style={{ color: 'var(--primary)', fontWeight: 700 }}>
              Política de Privacidad
            </a>{' '}
            de Brota.
          </span>
        </div>

        <button
          type="submit"
          disabled={loading || !formComplete}
          style={{
            background: 'var(--primary)', color: 'var(--primary-ink)',
            textAlign: 'center', fontWeight: 800, fontSize: 15,
            padding: 14, borderRadius: 13, border: 'none', cursor: 'pointer',
            boxShadow: '0 8px 20px var(--primary-glow)',
            opacity: (loading || !formComplete) ? .5 : 1, marginTop: 6,
          }}
        >
          {loading ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>

      </form>

      <p style={{ fontSize: 13, textAlign: 'center', color: 'var(--ink-soft)' }}>
        ¿Ya tienes cuenta?{' '}
        <button type="button" onClick={onSwitchToLogin} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--primary)', fontWeight: 700, fontSize: 13,
        }}>
          Inicia sesión
        </button>
      </p>

    </AuthCardShell>
  );
}

export default SignupCard;
