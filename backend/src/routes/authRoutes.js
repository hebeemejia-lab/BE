const express = require('express');
const router = express.Router();
const { register, login, getPerfil, updatePerfil } = require('../controllers/authController');
const verificarToken = require('../middleware/authMiddleware');

// Rutas públicas
router.post('/register', register);
router.post('/login', login);

// Rutas protegidas
router.get('/perfil', verificarToken, getPerfil);
router.put('/perfil', verificarToken, updatePerfil);

module.exports = router;
