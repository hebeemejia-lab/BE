const express = require('express');
const router = express.Router();
const circulosController = require('../controllers/circulosController');
const verificarToken = require('../middleware/authMiddleware');

router.post('/', verificarToken, circulosController.crearCirculo);
router.post('/:id/join', verificarToken, circulosController.unirseCirculo);
router.post('/:id/contribute', verificarToken, circulosController.aportarACirculo);
router.post('/:id/withdraw', verificarToken, circulosController.retirarDeCirculo);
router.get('/:id/status', verificarToken, circulosController.estadoCirculo);

module.exports = router;
