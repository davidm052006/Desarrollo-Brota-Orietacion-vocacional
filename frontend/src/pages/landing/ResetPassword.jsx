// ============================================================
// ResetPassword.jsx
// Página que se abre cuando el usuario llega desde el link
// del correo de recuperación enviado por Supabase.
//
// Supabase inyecta la sesión en la URL automáticamente.
// onAuthStateChange detecta el evento PASSWORD_RECOVERY y
// habilita el formulario para que el usuario cambie su contraseña.
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { updatePassword } from '../../services/authService';
import AuthCardShell from './components/AuthCardShell';
import Input from '../../components/Shared/Input';
import Button from '../../components/Shared/Button';
import LoginNavbar from './components/LoginNavbar';

function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword]           = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [sessionReady, setSessionReady]   = useState(false);
  const [success, setSuccess]             = useState(false);

  // Supabase emite el evento PASSWORD_RECOVERY cuando el usuario
  // llega desde el link del correo. Esperamos ese evento para
  // habilitar el formulario.
  // También revisamos la sesión activa al montar como fallback,
  // por si el evento ya se disparó antes de que el componente cargara.
  useEffect(() => {
    // Fallback: si ya hay sesión activa al montar (Supabase procesó el hash antes)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
          setSessionReady(true);
        }
      }
    );

    // Timeout de seguridad: si en 5 segundos no hay sesión,
    // mostramos un mensaje de enlace inválido en lugar del spinner infinito
    const timeout = setTimeout(() => {
      setSessionReady((current) => {
        if (!current) setError('El enlace es inválido o ya expiró. Solicita uno nuevo.');
        return current;
      });
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const validate = () => {
    const errors = {};
    if (!password) errors.password = 'La contraseña es requerida';
    else if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password))
      errors.password = 'Mínimo 8 caracteres, con letras y números';
    if (!confirmPassword) errors.confirmPassword = 'Confirma tu contraseña';
    else if (password !== confirmPassword) errors.confirmPassword = 'Las contraseñas no coinciden';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const { success: ok, error: updateError } = await updatePassword(password);
      if (!ok) {
        setError(updateError);
      } else {
        setSuccess(true);
        // Redirige al login después de 3 segundos
        setTimeout(() => navigate('/'), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-[url('/fondo-planta-crema.jpg')] bg-cover bg-center relative">
      <LoginNavbar />
      <div className="flex w-full pt-24 pb-12 px-20 items-center justify-center">

        <AuthCardShell
          title="Nueva contraseña"
          description={
            sessionReady
              ? 'Elige una contraseña segura de al menos 8 caracteres, con letras y números.'
              : 'Verificando tu enlace de recuperación...'
          }
        >
          {/* Estado: éxito */}
          {success && (
            <div className="bg-primary/20 border border-primary text-primary px-4 py-3 rounded-lg text-sm text-center">
              ✅ Contraseña actualizada. Redirigiendo al inicio de sesión...
            </div>
          )}

          {/* Estado: error general */}
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Estado: esperando sesión */}
          {!sessionReady && !success && (
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
              <p className="text-sm text-gray-500 text-center">
                Si llegaste desde el correo de recuperación, espera un momento.
              </p>
            </div>
          )}

          {/* Formulario — solo se muestra cuando la sesión está lista */}
          {sessionReady && !success && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                type="password"
                placeholder="Nueva contraseña..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setValidationErrors((prev) => ({ ...prev, password: '' }));
                }}
                error={validationErrors.password}
              />
              <Input
                type="password"
                placeholder="Confirmar contraseña..."
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setValidationErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }}
                error={validationErrors.confirmPassword}
              />
              <Button
                variant="secondary"
                className="w-full mt-2"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Cambiar contraseña'}
              </Button>
            </form>
          )}

          <p className="text-sm text-center text-black">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-[var(--color-primary)] font-bold hover:underline bg-transparent border-none cursor-pointer"
            >
              Volver al inicio de sesión
            </button>
          </p>
        </AuthCardShell>

      </div>
    </div>
  );
}

export default ResetPassword;
