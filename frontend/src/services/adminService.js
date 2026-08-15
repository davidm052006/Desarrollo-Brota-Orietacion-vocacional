import { API_URL, getAuthHeaders, parseResponse } from './apiClient';

// ─── Estadísticas ──────────────────────────────────────────────────────────
export const getStats = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/admin/stats`, { headers });
    return parseResponse(res);
  } catch (err) {
    console.error('adminService.getStats:', err);
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

// ─── Usuarios ──────────────────────────────────────────────────────────────

// Parámetros opcionales: pagina, limite, busqueda, rol
export const getUsuarios = async ({ pagina = 1, limite = 10, busqueda = '', rol = '' } = {}) => {
  try {
    const headers = await getAuthHeaders();
    const params  = new URLSearchParams({
      pagina,
      limite,
      ...(busqueda && { busqueda }),
      ...(rol      && { rol      }),
    });
    const res = await fetch(`${API_URL}/api/admin/usuarios?${params}`, { headers });
    return parseResponse(res);
  } catch (err) {
    console.error('adminService.getUsuarios:', err);
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

// datos: { email, password, nombre, apellido, ciudad, nivel_educativo, grado, edad, telefono, rol }
export const createUsuario = async (datos) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/admin/usuarios`, {
      method:  'POST',
      headers,
      body:    JSON.stringify(datos),
    });
    return parseResponse(res);
  } catch (err) {
    console.error('adminService.createUsuario:', err);
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

// datos: { nombre, apellido, ciudad, nivel_educativo, grado, edad, telefono, rol }
export const updateUsuario = async (id, datos) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/admin/usuarios/${id}`, {
      method:  'PATCH',
      headers,
      body:    JSON.stringify(datos),
    });
    return parseResponse(res);
  } catch (err) {
    console.error('adminService.updateUsuario:', err);
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

export const deleteUsuario = async (id) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/admin/usuarios/${id}`, { method: 'DELETE', headers });
    return parseResponse(res);
  } catch (err) {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

// ─── Instituciones ─────────────────────────────────────────────────────────
export const getInstituciones = async ({ pagina = 1, limite = 10, busqueda = '' } = {}) => {
  try {
    const headers = await getAuthHeaders();
    const params  = new URLSearchParams({ pagina, limite, ...(busqueda && { busqueda }) });
    const res = await fetch(`${API_URL}/api/admin/instituciones?${params}`, { headers });
    return parseResponse(res);
  } catch (err) {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

export const createInstitucion = async (datos) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/admin/instituciones`, { method: 'POST', headers, body: JSON.stringify(datos) });
    return parseResponse(res);
  } catch (err) {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

export const updateInstitucion = async (id, datos) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/admin/instituciones/${id}`, { method: 'PATCH', headers, body: JSON.stringify(datos) });
    return parseResponse(res);
  } catch (err) {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

export const deleteInstitucion = async (id) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/admin/instituciones/${id}`, { method: 'DELETE', headers });
    return parseResponse(res);
  } catch (err) {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

// ─── Programas ─────────────────────────────────────────────────────────────
export const getProgramas = async ({ pagina = 1, limite = 10, busqueda = '' } = {}) => {
  try {
    const headers = await getAuthHeaders();
    const params  = new URLSearchParams({ pagina, limite, ...(busqueda && { busqueda }) });
    const res = await fetch(`${API_URL}/api/admin/programas?${params}`, { headers });
    return parseResponse(res);
  } catch (err) {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

export const createPrograma = async (datos) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/admin/programas`, { method: 'POST', headers, body: JSON.stringify(datos) });
    return parseResponse(res);
  } catch (err) {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

export const updatePrograma = async (id, datos) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/admin/programas/${id}`, { method: 'PATCH', headers, body: JSON.stringify(datos) });
    return parseResponse(res);
  } catch (err) {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

export const deletePrograma = async (id) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/admin/programas/${id}`, { method: 'DELETE', headers });
    return parseResponse(res);
  } catch (err) {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

// ─── Cuestionarios ─────────────────────────────────────────────────────────
export const getCuestionarios = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/admin/cuestionarios`, { headers });
    return parseResponse(res);
  } catch (err) {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

export const createCuestionario = async (datos) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/admin/cuestionarios`, { method: 'POST', headers, body: JSON.stringify(datos) });
    return parseResponse(res);
  } catch (err) {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

export const updateCuestionario = async (id, datos) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/admin/cuestionarios/${id}`, { method: 'PATCH', headers, body: JSON.stringify(datos) });
    return parseResponse(res);
  } catch (err) {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

export const deleteCuestionario = async (id) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/admin/cuestionarios/${id}`, { method: 'DELETE', headers });
    return parseResponse(res);
  } catch (err) {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

// ─── Preguntas ─────────────────────────────────────────────────────────────
export const getPreguntas = async ({ cuestionario_id = '', busqueda = '' } = {}) => {
  try {
    const headers = await getAuthHeaders();
    const params  = new URLSearchParams({ ...(cuestionario_id && { cuestionario_id }), ...(busqueda && { busqueda }) });
    const res = await fetch(`${API_URL}/api/admin/preguntas?${params}`, { headers });
    return parseResponse(res);
  } catch (err) {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

export const createPregunta = async (datos) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/admin/preguntas`, { method: 'POST', headers, body: JSON.stringify(datos) });
    return parseResponse(res);
  } catch (err) {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

export const updatePregunta = async (id, datos) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/admin/preguntas/${id}`, { method: 'PATCH', headers, body: JSON.stringify(datos) });
    return parseResponse(res);
  } catch (err) {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

export const deletePregunta = async (id) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/admin/preguntas/${id}`, { method: 'DELETE', headers });
    return parseResponse(res);
  } catch (err) {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

// ─── Preguntas de comunidad (moderación) ───────────────────────────────────
export const getPreguntasComunidad = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/admin/preguntas-comunidad`, { headers });
    return parseResponse(res);
  } catch (err) {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

export const deletePreguntaComunidad = async (id) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/admin/preguntas-comunidad/${id}`, { method: 'DELETE', headers });
    return parseResponse(res);
  } catch (err) {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

// ─── Sincronización MEN ────────────────────────────────────────────────────
export const getSincronizacionEstado = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/admin/sincronizacion/estado`, { headers });
    return parseResponse(res);
  } catch (err) {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

export const ejecutarSincronizacion = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/admin/sincronizacion/ejecutar`, {
      method: 'POST',
      headers,
    });
    return parseResponse(res);
  } catch (err) {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};
