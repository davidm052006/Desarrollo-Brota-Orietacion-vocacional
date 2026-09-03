import { API_URL, getAuthHeaders, parseResponse } from './apiClient';

// El "perfil"/cuestionario propio de la cuenta institución (contacto,
// teléfono, descripción) reutiliza perfilService.obtenerPerfil/actualizarPerfil
// — es la misma fila de perfiles_usuario, no hace falta un endpoint aparte.
// Este service es solo para lo que sí es dominio nuevo: los programas propios.

export const getMisProgramas = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/institucion/programas`, { headers });
    return parseResponse(res);
  } catch (err) {
    console.error('institucionService.getMisProgramas:', err);
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

// datos: { descripcion, requisitos, costo_matricula, activo }
export const actualizarMiPrograma = async (id, datos) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/institucion/programas/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(datos),
    });
    return parseResponse(res);
  } catch (err) {
    console.error('institucionService.actualizarMiPrograma:', err);
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

// ─── Usuarios (estudiantes propios) ────────────────────────────────────────
export const getUsuarios = async ({ pagina = 1, limite = 10, busqueda = '' } = {}) => {
  try {
    const headers = await getAuthHeaders();
    const params  = new URLSearchParams({ pagina, limite, ...(busqueda && { busqueda }) });
    const res = await fetch(`${API_URL}/api/institucion/usuarios?${params}`, { headers });
    return parseResponse(res);
  } catch {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

// datos: { email, password, nombre, apellido, ciudad, nivel_educativo, grado, fecha_nacimiento, telefono, condiciones_socioeconomicas }
export const createUsuario = async (datos) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/institucion/usuarios`, { method: 'POST', headers, body: JSON.stringify(datos) });
    return parseResponse(res);
  } catch {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

export const createUsuariosMasivo = async (usuarios) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/institucion/usuarios/masivo`, {
      method: 'POST', headers, body: JSON.stringify({ usuarios }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: body.message || `Error del servidor (${res.status})`, resultados: [] };
    return { success: true, resultados: body.resultados };
  } catch {
    return { success: false, error: 'Error de conexión con el servidor', resultados: [] };
  }
};

export const deleteUsuario = async (id) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/institucion/usuarios/${id}`, { method: 'DELETE', headers });
    return parseResponse(res);
  } catch {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

// ─── Cuestionarios propios ─────────────────────────────────────────────────
export const getCuestionarios = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/institucion/cuestionarios`, { headers });
    return parseResponse(res);
  } catch {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

export const createCuestionario = async (datos) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/institucion/cuestionarios`, { method: 'POST', headers, body: JSON.stringify(datos) });
    return parseResponse(res);
  } catch {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

export const actualizarCuestionario = async (id, datos) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/institucion/cuestionarios/${id}`, { method: 'PATCH', headers, body: JSON.stringify(datos) });
    return parseResponse(res);
  } catch {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

export const eliminarCuestionario = async (id) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/institucion/cuestionarios/${id}`, { method: 'DELETE', headers });
    return parseResponse(res);
  } catch {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

// ─── Preguntas (de un cuestionario propio) ─────────────────────────────────
export const getPreguntas = async (cuestionarioId) => {
  try {
    const headers = await getAuthHeaders();
    const params  = new URLSearchParams({ cuestionario_id: cuestionarioId });
    const res = await fetch(`${API_URL}/api/institucion/preguntas?${params}`, { headers });
    return parseResponse(res);
  } catch {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

// datos: { cuestionario_id, texto, tipo, orden, categoria, peso, opciones: [{ label, icon, orden, pesos: { categoria: puntos } }] }
export const crearPregunta = async (datos) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/institucion/preguntas`, { method: 'POST', headers, body: JSON.stringify(datos) });
    return parseResponse(res);
  } catch {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

export const actualizarPregunta = async (id, datos) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/institucion/preguntas/${id}`, { method: 'PATCH', headers, body: JSON.stringify(datos) });
    return parseResponse(res);
  } catch {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

export const eliminarPregunta = async (id) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/institucion/preguntas/${id}`, { method: 'DELETE', headers });
    return parseResponse(res);
  } catch {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

// ─── Analíticas (solo de estudiantes propios) ──────────────────────────────
export const getAnalytics = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/institucion/analytics`, { headers });
    return parseResponse(res);
  } catch {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};
