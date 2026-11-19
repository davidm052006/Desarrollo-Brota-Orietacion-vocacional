const API_URL = import.meta.env.VITE_API_URL ?? '';

const leerJson = async (res) => {
  const contentType = res.headers?.get?.('content-type') ?? '';
  if (contentType && !contentType.includes('application/json')) {
    throw new Error('Respuesta no JSON del servidor');
  }
  return res.json();
};

export const obtenerProgramas = async ({ area, search, page = 1, limit = 24 } = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (area && area !== 'todos') params.set('area', area);
  if (search?.trim()) params.set('search', search.trim());

  try {
    const res  = await fetch(`${API_URL}/api/programas?${params}`);
    const json = await leerJson(res);
    if (!res.ok) return { success: false, error: json.error || json.message || `Error del servidor (${res.status})`, data: [], total: 0 };
    return json;
  } catch (e) {
    return { success: false, error: e.message, data: [], total: 0 };
  }
};

export const obtenerEstadisticas = async () => {
  try {
    const res  = await fetch(`${API_URL}/api/programas/stats`);
    const json = await leerJson(res);
    if (!res.ok) return { success: false, error: json.error || json.message || `Error del servidor (${res.status})`, total: 0, areas: [] };
    return json;
  } catch (e) {
    return { success: false, error: e.message, total: 0, areas: [] };
  }
};
