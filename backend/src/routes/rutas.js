const express        = require('express');
const router         = express.Router();
const verificarAuth  = require('../middlewares/verificarAuth');
const { getAreasDisponibles, getRutaPorArea } = require('../controllers/rutasController');

router.use(verificarAuth);

router.get('/',       getAreasDisponibles);
router.get('/:area',  getRutaPorArea);

module.exports = router;
