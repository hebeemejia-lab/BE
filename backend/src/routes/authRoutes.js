const express = require('express');
const router = express.Router();
const { register, login, getPerfil, updatePerfil, verifyEmail, resendVerification } = require('../controllers/authController');
const verificarToken = require('../middleware/authMiddleware');
const verificarRecaptcha = require('../middleware/recaptchaMiddleware');

// Rutas públicas
router.post('/register', register);
router.post('/login', verificarRecaptcha, login);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

// Rutas protegidas
router.get('/perfil', verificarToken, getPerfil);
router.put('/perfil', verificarToken, updatePerfil);

module.exports = router;
