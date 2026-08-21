const express             = require('express');
const router              = express.Router();
const verificarAuth       = require('../middlewares/verificarAuth');
const verificarModeracion = require('../middlewares/verificarModeracion');

const {
  getForos, getPostsByForo, createPost, getPost, votarPost, responderPost,
} = require('../controllers/comunidad/forosController');
const {
  getHistorias, getHistoria, crearHistoria, toggleLikeHistoria,
} = require('../controllers/comunidad/historiasController');
const {
  getPreguntas, getPregunta, crearPregunta, responderPregunta, marcarMejorRespuesta, reportarPregunta,
} = require('../controllers/comunidad/preguntasController');
const {
  getConvocatorias, getConvocatoria,
} = require('../controllers/comunidad/convocatoriasController');
const {
  getNotificaciones,
} = require('../controllers/comunidad/notificacionesController');
const {
  getFeedReciente,
} = require('../controllers/comunidad/feedController');
const {
  ocultarPublicacion, eliminarPublicacion, getInfoAutor,
} = require('../controllers/comunidad/moderacionController');

// ── Foros ─────────────────────────────────────────────────────────────────────
router.get('/foros',                verificarAuth, getForos);
router.get('/foros/:id/posts',      verificarAuth, getPostsByForo);
router.post('/foros/:id/posts',     verificarAuth, createPost);

// ── Posts ─────────────────────────────────────────────────────────────────────
router.get('/posts/:id',            verificarAuth, getPost);
router.post('/posts/:id/votar',     verificarAuth, votarPost);
router.post('/posts/:id/respuestas', verificarAuth, responderPost);

// ── Historias ─────────────────────────────────────────────────────────────────
router.get('/historias',            verificarAuth, getHistorias);
router.get('/historias/:id',        verificarAuth, getHistoria);
router.post('/historias',           verificarAuth, crearHistoria);
router.post('/historias/:id/like',  verificarAuth, toggleLikeHistoria);

// ── Preguntas ─────────────────────────────────────────────────────────────────
router.get('/preguntas',            verificarAuth, getPreguntas);
router.get('/preguntas/:id',        verificarAuth, getPregunta);
router.post('/preguntas',           verificarAuth, crearPregunta);
router.post('/preguntas/:id/respuestas', verificarAuth, responderPregunta);
router.patch('/preguntas/:id/respuestas/:rid/mejor', verificarAuth, marcarMejorRespuesta);
router.post('/preguntas/:id/reportar', verificarAuth, reportarPregunta);

// ── Convocatorias ─────────────────────────────────────────────────────────────
router.get('/convocatorias',        verificarAuth, getConvocatorias);
router.get('/convocatorias/:id',    verificarAuth, getConvocatoria);

// ── Notificaciones ────────────────────────────────────────────────────────────
router.get('/notificaciones',       verificarAuth, getNotificaciones);

// ── Feed (últimas publicaciones para el Dashboard) ──────────────────────────────
router.get('/feed',                 verificarAuth, getFeedReciente);

// ── Moderación (solo admin/moderador) ────────────────────────────────────────
// :tipo es 'post' | 'historia' | 'pregunta' — ver TABLAS en moderacionController.js
router.patch('/moderacion/:tipo/:id/ocultar', verificarModeracion, ocultarPublicacion);
router.delete('/moderacion/:tipo/:id',        verificarModeracion, eliminarPublicacion);
router.get('/moderacion/autor/:userId',       verificarModeracion, getInfoAutor);

module.exports = router;
