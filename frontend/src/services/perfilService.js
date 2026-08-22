import { API_URL, getAuthHeaders, parseResponse } from './apiClient';

// ─────────────────────────────────────────────────────────────
// CUESTIONARIO
// GET /api/perfil/cuestionario
// ─────────────────────────────────────────────────────────────
export const obtenerCuestionario = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/perfil/cuestionario`, { headers });
    return parseResponse(res);
  } catch (err) {
    console.error('perfilService.obtenerCuestionario:', err);
    return { success: false, error: 'Error de conexión.' };
  }
};

// ─────────────────────────────────────────────────────────────
// GUARDAR RESULTADO
// POST /api/perfil/resultado
// Solo envía respuestas crudas — el backend calcula el perfil.
// ─────────────────────────────────────────────────────────────
export const guardarResultado = async (perfilUsuarioId, cuestionarioId, respuestas) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/perfil/resultado`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        perfil_usuario_id: perfilUsuarioId,
        cuestionario_id:   cuestionarioId,
        respuestas,
      }),
    });
    return parseResponse(res);
  } catch (err) {
    console.error('perfilService.guardarResultado:', err);
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

// ─────────────────────────────────────────────────────────────
// OBTENER ÚLTIMO RESULTADO
// GET /api/perfil/resultado/:perfilUsuarioId
// ─────────────────────────────────────────────────────────────
export const obtenerResultado = async (perfilUsuarioId) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/perfil/resultado/${perfilUsuarioId}`, { headers });
    return parseResponse(res);
  } catch (err) {
    console.error('perfilService.obtenerResultado:', err);
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

// ─────────────────────────────────────────────────────────────
// RECOMENDACIONES
// GET /api/perfil/recomendaciones/:resultadoId
// ─────────────────────────────────────────────────────────────
export const obtenerRecomendaciones = async (resultadoId) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/perfil/recomendaciones/${resultadoId}`, { headers });
    return parseResponse(res);
  } catch (err) {
    console.error('perfilService.obtenerRecomendaciones:', err);
    return { success: false, error: 'Error al cargar recomendaciones.' };
  }
};

// ─────────────────────────────────────────────────────────────
// MARCAR RECOMENDACIÓN COMO VISTA
// PATCH /api/perfil/recomendaciones/:id/vista
// ─────────────────────────────────────────────────────────────
export const marcarRecomendacionVista = async (recomendacionId) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/perfil/recomendaciones/${recomendacionId}/vista`, {
      method: 'PATCH',
      headers,
    });
    return parseResponse(res);
  } catch (err) {
    console.error('perfilService.marcarRecomendacionVista:', err);
    return { success: false, error: 'Error al actualizar.' };
  }
};

// ─────────────────────────────────────────────────────────────
// ELIMINAR RESULTADOS
// DELETE /api/perfil/resultado/:perfilUsuarioId
// ─────────────────────────────────────────────────────────────
export const eliminarResultado = async (perfilUsuarioId) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/perfil/resultado/${perfilUsuarioId}`, {
      method: 'DELETE',
      headers,
    });
    return parseResponse(res);
  } catch (err) {
    console.error('perfilService.eliminarResultado:', err);
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

// ─────────────────────────────────────────────────────────────
// PERFIL COMPLETO DEL USUARIO
// GET /api/perfil/:userId
// ─────────────────────────────────────────────────────────────
export const obtenerPerfil = async (userId) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/perfil/${userId}`, { headers });
    return parseResponse(res);
  } catch (err) {
    console.error('perfilService.obtenerPerfil:', err);
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

// ─────────────────────────────────────────────────────────────
// ACTUALIZAR PERFIL PROPIO (sección Ajustes)
// PATCH /api/perfil/:userId
// ─────────────────────────────────────────────────────────────
export const actualizarPerfil = async (userId, datos) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/perfil/${userId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(datos),
    });
    return parseResponse(res);
  } catch (err) {
    console.error('perfilService.actualizarPerfil:', err);
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

export const actualizarBroti = async (userId, broti_config) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/perfil/${userId}/broti`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ broti_config }),
    });
    return parseResponse(res);
  } catch (err) {
    console.error('perfilService.actualizarBroti:', err);
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};
