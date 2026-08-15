import { API_URL, getAuthHeaders, parseResponse } from './apiClient';

export const getAreasDisponibles = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/rutas`, { headers });
    return parseResponse(res);
  } catch (err) {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};

export const getRutaPorArea = async (area) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/rutas/${area}`, { headers });
    return parseResponse(res);
  } catch (err) {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
};
