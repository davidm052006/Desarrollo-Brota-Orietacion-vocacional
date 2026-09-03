import { supabase } from '../config/supabase';

export const API_URL = import.meta.env.VITE_API_URL ?? '';

// Obtiene el token de sesión activo para enviarlo al backend
export const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();

  return {
    'Content-Type': 'application/json',
    ...(session?.access_token && {
      Authorization: `Bearer ${session.access_token}`,
    }),
  };
};

// Parsea la respuesta HTTP
export const parseResponse = async (res) => {
  let body;

  try {
    body = await res.json();
  } catch {
    body = {};
  }

  if (!res.ok) {
    const error = body.error || body.message || `Error del servidor (${res.status})`;

    if (error === 'BLOQUEADO') {
      window.dispatchEvent(
        new CustomEvent('cuenta-bloqueada', {
          detail: { hasta: body.hasta },
        })
      );
    }

    return {
      success: false,
      error,
      hasta: body.hasta,
      status: res.status,
    };
  }

  return {
    success: true,
    data: body.data,
    meta: body.meta,
  };
};
