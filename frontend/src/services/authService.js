import { supabase } from '../config/supabase';
import { translateAuthError } from '../utils/authErrors';

const API_URL = import.meta.env.VITE_API_URL ?? '';

// ─────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────
export const loginWithEmail = async (email, password) => {
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: translateAuthError(error.message) };
    return { success: true };
  } catch (err) {
    console.error('authService.loginWithEmail:', err);
    return { success: false, error: 'Error de conexión. Intenta nuevamente.' };
  }
};

// ─────────────────────────────────────────────────────────────
// REGISTRO
// Flujo:
//   1. Supabase Auth crea el usuario y devuelve una sesión con token
//   2. El backend crea perfiles_usuario usando ese token
//   3. Si el paso 2 falla, el backend hace rollback con su service_role_key
// ─────────────────────────────────────────────────────────────
export const signUpWithEmail = async (email, password, nombre, apellido, extraFields = {}) => {
  try {
    // Paso 1: crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });

    if (authError) {
      return { success: false, error: translateAuthError(authError.message) };
    }

    const token = authData.session?.access_token;

    if (!token) {
      return {
        success: false,
        error: 'Revisa tu correo para confirmar tu cuenta antes de continuar.',
      };
    }

    // Paso 2: crear perfil en el backend con todos los campos
    const res = await fetch(`${API_URL}/api/auth/register-perfil`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ nombre, apellido, ...extraFields }),
    });

    const body = await res.json();

    if (!res.ok) {
      return { success: false, error: body.message || 'Error al crear el perfil.' };
    }

    return { success: true };
  } catch (err) {
    console.error('authService.signUpWithEmail:', err);
    return { success: false, error: 'Error de conexión. Intenta nuevamente.' };
  }
};

// ─────────────────────────────────────────────────────────────
// RECUPERACIÓN DE CONTRASEÑA
// ─────────────────────────────────────────────────────────────
export const sendPasswordReset = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return { success: false, error: translateAuthError(error.message) };
    return { success: true };
  } catch (err) {
    console.error('authService.sendPasswordReset:', err);
    return { success: false, error: 'Error de conexión. Intenta nuevamente.' };
  }
};
 
export const verifyOtpAndUpdatePassword = async (email, token, newPassword) => {
  try {
    const { error: otpError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery',
    });
  
    if (otpError) {
      console.error('verifyOtp error:', otpError.message);
      return {
        success: false,
        error: 'Código incorrecto o expirado. Verifica e intenta de nuevo.',
      };
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
 
    if (updateError) return { success: false, error: translateAuthError(updateError.message) };
    return { success: true };
  } catch (err) {
    console.error('authService.verifyOtpAndUpdatePassword:', err);
    return { success: false, error: 'Error de conexión. Intenta nuevamente.' };
  }
};
  
// ─────────────────────────────────────────────────────────────
// ACTUALIZAR CONTRASEÑA (usado en ResetPassword.jsx)
// ─────────────────────────────────────────────────────────────
export const updatePassword = async (newPassword) => {
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: translateAuthError(error.message) };
    return { success: true };
  } catch (err) {
    console.error('authService.updatePassword:', err);
    return { success: false, error: 'Error de conexión. Intenta nuevamente.' };
  }
};