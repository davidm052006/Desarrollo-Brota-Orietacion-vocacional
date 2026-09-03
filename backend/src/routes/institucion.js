const express = require('express');
const router = express.Router();
const verificarInstitucion = require('../middlewares/verificarInstitucion');
const { getMisProgramas, actualizarMiPrograma } = require('../controllers/institucion/programasController');
const {
  getUsuarios, createUsuario, createUsuariosMasivo, deleteUsuario,
} = require('../controllers/institucion/usuariosController');
const {
  getCuestionarios, createCuestionario, updateCuestionario, deleteCuestionario,
} = require('../controllers/institucion/cuestionariosController');
const {
  getPreguntas, createPregunta, updatePregunta, deletePregunta,
} = require('../controllers/institucion/preguntasController');
const { getAnalytics } = require('../controllers/institucion/analyticsController');

router.use(verificarInstitucion);

router.get('/analytics', getAnalytics);

router.get  ('/programas',     getMisProgramas);
router.patch('/programas/:id', actualizarMiPrograma);

router.get   ('/usuarios',        getUsuarios);
router.post  ('/usuarios/masivo', createUsuariosMasivo); // antes de /usuarios/:id, mismo criterio que admin.js
router.post  ('/usuarios',        createUsuario);
router.delete('/usuarios/:id',    deleteUsuario);

router.get   ('/cuestionarios',     getCuestionarios);
router.post  ('/cuestionarios',     createCuestionario);
router.patch ('/cuestionarios/:id', updateCuestionario);
router.delete('/cuestionarios/:id', deleteCuestionario);

router.get   ('/preguntas',     getPreguntas);
router.post  ('/preguntas',     createPregunta);
router.patch ('/preguntas/:id', updatePregunta);
router.delete('/preguntas/:id', deletePregunta);

module.exports = router;
