import { API_URL, getAuthHeaders, parseResponse } from './apiClient';

const get = async (path) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/comunidad${path}`, { headers });
    return parseResponse(res);
  } catch (err) {
    return { success: false, error: 'Error de conexión' };
  }
};

const post = async (path, body) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/comunidad${path}`, {
      method: 'POST', headers, body: JSON.stringify(body),
    });
    return parseResponse(res);
  } catch (err) {
    return { success: false, error: 'Error de conexión' };
  }
};

const patch = async (path) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/comunidad${path}`, { method: 'PATCH', headers });
    return parseResponse(res);
  } catch (err) {
    return { success: false, error: 'Error de conexión' };
  }
};

const del = async (path) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/comunidad${path}`, { method: 'DELETE', headers });
    return parseResponse(res);
  } catch (err) {
    return { success: false, error: 'Error de conexión' };
  }
};

// ── Foros ─────────────────────────────────────────────────────────────────────
export const getForos            = ()               => get('/foros');
export const getPostsByForo      = (foroId, orden)  => get(`/foros/${foroId}/posts?orden=${orden ?? 'recientes'}`);
export const createPost          = (foroId, datos)  => post(`/foros/${foroId}/posts`, datos);

// ── Posts ─────────────────────────────────────────────────────────────────────
export const getPost             = (postId)         => get(`/posts/${postId}`);
export const votarPost           = (postId, dir)    => post(`/posts/${postId}/votar`, { direccion: dir });
export const responderPost       = (postId, datos)  => post(`/posts/${postId}/respuestas`, datos);

// ── Historias ─────────────────────────────────────────────────────────────────
export const getHistorias        = ()               => get('/historias');
export const getHistoria         = (id)             => get(`/historias/${id}`);
export const crearHistoria       = (datos)          => post('/historias', datos);
export const toggleLikeHistoria  = (id)             => post(`/historias/${id}/like`, {});

// ── Preguntas ─────────────────────────────────────────────────────────────────
export const getPreguntas        = ()               => get('/preguntas');
export const getPregunta         = (id)             => get(`/preguntas/${id}`);
export const crearPregunta       = (datos)          => post('/preguntas', datos);
export const responderPregunta   = (id, datos)      => post(`/preguntas/${id}/respuestas`, datos);
export const marcarMejorRespuesta = (pregId, rId)   => patch(`/preguntas/${pregId}/respuestas/${rId}/mejor`);
export const reportarPregunta    = (id, motivo)     => post(`/preguntas/${id}/reportar`, { motivo });

// ── Convocatorias ─────────────────────────────────────────────────────────────
export const getConvocatorias    = ()               => get('/convocatorias');
export const getConvocatoria     = (id)             => get(`/convocatorias/${id}`);

// ── Feed (últimas publicaciones para el Dashboard) ──────────────────────────────
export const getFeedReciente     = ()               => get('/feed');

// ── Notificaciones ───────────────────────────────────────────────────────────
export const getNotificaciones   = ()               => get('/notificaciones');

// ── Moderación (admin/moderador) ─────────────────────────────────────────────
// tipo: 'post' | 'historia' | 'pregunta'
export const ocultarPublicacion  = (tipo, id)       => patch(`/moderacion/${tipo}/${id}/ocultar`);
export const eliminarPublicacion = (tipo, id)       => del(`/moderacion/${tipo}/${id}`);
export const getInfoAutor        = (userId)         => get(`/moderacion/autor/${userId}`);
