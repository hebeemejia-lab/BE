const express = require('express');
const router = express.Router();

const verificarToken = require('../middleware/authMiddleware');
const {
  listarTemas,
  crearTema,
  obtenerTema,
  crearRespuesta,
} = require('../controllers/forumController');

router.get('/temas', verificarToken, listarTemas);
router.post('/temas', verificarToken, crearTema);
router.get('/temas/:temaId', verificarToken, obtenerTema);
router.post('/temas/:temaId/respuestas', verificarToken, crearRespuesta);

module.exports = router;
