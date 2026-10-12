
// useAuth.js
// Custom hook que centraliza toda la lógica del formulario
// de autenticación (login, registro, recuperación de contraseña).


import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateFields, isValidEmail } from '../utils/validation';
import { loginWithEmail, signUpWithEmail, sendPasswordReset } from '../services/authService';

export const useAuth = () => {
  const navigate = useNavigate();

  // ── Estado del formulario ────────────────────────────────────
  const [mode, setMode]                       = useState('login');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [primerNombre, setPrimerNombre]       = useState('');
  const [segundoNombre, setSegundoNombre]     = useState('');
  const [primerApellido, setPrimerApellido]   = useState('');
  const [segundoApellido, setSegundoApellido] = useState('');
  const [nivelEducativo, setNivelEducativo]   = useState('');
  const [grado, setGrado]                     = useState('');
  const [edad, setEdad]                       = useState('');
  const [ciudad, setCiudad]                   = useState('');
  const [telefono, setTelefono]               = useState('');
  const [termsAccepted, setTermsAccepted]     = useState(false);

  // ── Estado de UI ─────────────────────────────────────────────
  const [loading, setLoading]                   = useState(false);
  const [error, setError]                       = useState(null);
  const [successMessage, setSuccessMessage]     = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // ── Helpers internos ─────────────────────────────────────────
  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
    setValidationErrors({});
  };

  const clearFieldError = (field) =>
    setValidationErrors((prev) => ({ ...prev, [field]: '' }));

  const changeMode = (nextMode) => {
    clearMessages();
    setTermsAccepted(false);
    setMode(nextMode);
  };

  // ── Handlers de campos ───────────────────────────────────────
  const fieldHandlers = {
    onPrimerNombreChange:    (e) => { setPrimerNombre(e.target.value);    clearFieldError('primerNombre');   clearFieldError('nombre'); },
    onSegundoNombreChange:   (e) => { setSegundoNombre(e.target.value);   clearFieldError('segundoNombre'); },
    onPrimerApellidoChange:  (e) => { setPrimerApellido(e.target.value);  clearFieldError('primerApellido'); clearFieldError('apellido'); },
    onSegundoApellidoChange: (e) => { setSegundoApellido(e.target.value); clearFieldError('segundoApellido'); },
    onEmailChange:           (e) => { 
      const value = e.target.value;
      setEmail(value);
      if (!value) {
        clearFieldError('email');
      } else if (!isValidEmail(value)) {
        setValidationErrors((prev) => ({ ...prev, email: 'Correo inválido' }));
      } else {
        clearFieldError('email');
      }
    },
    onPasswordChange:        (e) => { setPassword(e.target.value);        clearFieldError('password'); },
    onConfirmPasswordChange: (e) => { setConfirmPassword(e.target.value); clearFieldError('confirmPassword'); },
    onNivelEducativoChange:  (value) => { setNivelEducativo(value);       clearFieldError('nivelEducativo'); },
    onGradoChange: (value) => { setGrado(value); clearFieldError('grado'); },
    onEdadChange:            (e) => { setEdad(e.target.value);            clearFieldError('edad'); },
    onCiudadChange:          (e) => { setCiudad(e.target.value);          clearFieldError('ciudad'); },
    onTelefonoChange:        (e) => { setTelefono(e.target.value);        clearFieldError('telefono'); },
    onTermsAcceptedChange:   (e) => { setTermsAccepted(e.target.checked); clearFieldError('termsAccepted'); },
  };

  // ── Handler: Login ───────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    clearMessages();

    const errors = validateFields({ email, password }, mode);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const { success, error: authError } = await loginWithEmail(email, password);
      if (!success) setError(authError);
      else navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // ── Handler: Registro ────────────────────────────────────────
  const handleSignup = async (e) => {
    e.preventDefault();
    clearMessages();

    const nombre   = `${primerNombre} ${segundoNombre}`.trim();
    const apellido = `${primerApellido} ${segundoApellido}`.trim();

    const errors = validateFields(
      { email, password, nombre, apellido, confirmPassword,
        nivelEducativo, grado, edad, ciudad, telefono },
      mode
    );

    // Mapear errores genéricos a campos específicos del formulario
    if (errors.nombre)   errors.primerNombre   = errors.nombre;
    if (errors.apellido) errors.primerApellido = errors.apellido;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (!termsAccepted) {
      setError('Debes aceptar los términos y condiciones para continuar.');
      return;
    }

    setLoading(true);
    try {
      const { success, error: authError } = await signUpWithEmail(
        email, password, nombre, apellido,
        { nivelEducativo, grado, fechaNacimiento: edad, ciudad, telefono }
      );
      if (!success) setError(authError);
      else navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // ── Handler: Recuperación de contraseña ──────────────────────
  const handlePasswordRecovery = async (e) => {
    e.preventDefault();
    clearMessages();

    const errors = validateFields({ email }, 'forgotPassword');
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const { success, error: authError } = await sendPasswordReset(email);
      if (!success) setError(authError);
      else setSuccessMessage('Revisa tu correo para restablecer tu contraseña.');
    } finally {
      setLoading(false);
    }
  };

  // ── Valor expuesto por el hook ────────────────────────────────
  return {
    mode, email, password, confirmPassword,
    primerNombre, segundoNombre, primerApellido, segundoApellido,
    nivelEducativo, grado, edad, ciudad, telefono, termsAccepted,
    loading, error, successMessage, validationErrors,
    ...fieldHandlers,
    handleLogin, handleSignup, handlePasswordRecovery,
    changeMode,
  };
};