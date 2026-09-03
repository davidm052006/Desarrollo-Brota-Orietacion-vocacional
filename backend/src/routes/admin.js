const express        = require('express');
const router         = express.Router();
const verificarAdmin = require('../middlewares/verificarAdmin');
const {
  getUsuarios, getUsuario, createUsuario, createUsuariosMasivo,
  updateUsuario, updatePermisosUsuario, deleteUsuario, getStats,
} = require('../controllers/admin/usuariosController');
const {
  getInstituciones, createInstitucion, updateInstitucion, deleteInstitucion,
} = require('../controllers/admin/institucionesController');
const {
  getProgramas, createPrograma, updatePrograma, deletePrograma,
} = require('../controllers/admin/programasController');
const {
  getCuestionarios, createCuestionario, updateCuestionario, deleteCuestionario,
} = require('../controllers/admin/cuestionariosController');
const {
  getPreguntas, createPregunta, updatePregunta, deletePregunta,
} = require('../controllers/admin/preguntasController');
const {
  getContactos, updateContacto,
} = require('../controllers/admin/contactosController');
const {
  getPreguntasComunidad, deletePreguntaComunidad,
} = require('../controllers/admin/preguntasComunidadController');
const { getEstado, ejecutarSincronizacion } = require('../controllers/sincronizacionController');
const { getAnalytics } = require('../controllers/admin/analyticsController');

router.use(verificarAdmin);

router.get('/stats', getStats);
router.get('/analytics', getAnalytics);

router.get   ('/usuarios',             getUsuarios);
router.post  ('/usuarios/masivo',      createUsuariosMasivo); // antes de /usuarios/:id para que no lo capture como :id
router.get   ('/usuarios/:id',         getUsuario);
router.post  ('/usuarios',             createUsuario);
router.patch ('/usuarios/:id',         updateUsuario);
router.patch ('/usuarios/:id/permisos', updatePermisosUsuario);
router.delete('/usuarios/:id',         deleteUsuario);

router.get   ('/instituciones',     getInstituciones);
router.post  ('/instituciones',     createInstitucion);
router.patch ('/instituciones/:id', updateInstitucion);
router.delete('/instituciones/:id', deleteInstitucion);

router.get   ('/programas',     getProgramas);
router.post  ('/programas',     createPrograma);
router.patch ('/programas/:id', updatePrograma);
router.delete('/programas/:id', deletePrograma);

router.get   ('/cuestionarios',     getCuestionarios);
router.post  ('/cuestionarios',     createCuestionario);
router.patch ('/cuestionarios/:id', updateCuestionario);
router.delete('/cuestionarios/:id', deleteCuestionario);

router.get   ('/preguntas',     getPreguntas);
router.post  ('/preguntas',     createPregunta);
router.patch ('/preguntas/:id', updatePregunta);
router.delete('/preguntas/:id', deletePregunta);

router.get   ('/contactos',     getContactos);
router.patch ('/contactos/:id', updateContacto);

router.get   ('/preguntas-comunidad',     getPreguntasComunidad);
router.delete('/preguntas-comunidad/:id', deletePreguntaComunidad);

router.get ('/sincronizacion/estado',   getEstado);
router.post('/sincronizacion/ejecutar', ejecutarSincronizacion);

module.exports = router;