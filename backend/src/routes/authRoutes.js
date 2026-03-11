const express = require('express');
const router = express.Router();
const { register, login, getPerfil, updatePerfil, verifyEmail, resendVerification, googleLogin } = require('../controllers/authController');
router.post('/google-login', googleLogin);
const verificarToken = require('../middleware/authMiddleware');


// Rutas públicas
router.post('/register', register);
router.post('/login', login);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

// Rutas protegidas
router.get('/perfil', verificarToken, getPerfil);
router.put('/perfil', verificarToken, updatePerfil);

module.exports = router;
