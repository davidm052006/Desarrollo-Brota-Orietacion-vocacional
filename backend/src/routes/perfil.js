const express       = require('express');
const router        = express.Router();
const verificarAuth = require('../middlewares/verificarAuth');
const {
  obtenerCuestionario,
  guardarResultado,
  obtenerResultado,
  obtenerRecomendaciones,
  marcarRecomendacionVista,
  eliminarResultado,
  obtenerPerfil,
  actualizarPerfil,
  actualizarBroti,
  obtenerMisPermisos,
} = require('../controllers/perfilController');

// Todas las rutas de perfil requieren sesión válida
router.use(verificarAuth);

// Cuestionario
router.get('/cuestionario', obtenerCuestionario);

// Permisos efectivos del usuario logueado — antes de /:userId para que no
// lo capture ese parámetro.
router.get('/permisos', obtenerMisPermisos);

// Resultados
router.post  ('/resultado',                    guardarResultado);
router.get   ('/resultado/:perfilUsuarioId',   obtenerResultado);
router.delete('/resultado/:perfilUsuarioId',   eliminarResultado);

// Recomendaciones
router.get  ('/recomendaciones/:resultadoId',        obtenerRecomendaciones);
router.patch('/recomendaciones/:id/vista',           marcarRecomendacionVista);

// Perfil de usuario
router.get  ('/:userId', obtenerPerfil);
router.patch('/:userId', actualizarPerfil);
router.patch('/:userId/broti', actualizarBroti);

module.exports = router;
