const axios = require('axios');

/**
 * Middleware para validar reCAPTCHA v3
 * Verifica el token de reCAPTCHA enviado desde el frontend
 */
const verificarRecaptcha = async (req, res, next) => {
  try {
    const recaptchaToken = req.body.recaptchaToken;

    // Si no hay token, permitir (reCAPTCHA puede no haber cargado)
    if (!recaptchaToken) {
      console.log('ℹ️ No reCAPTCHA token provided - proceeding');
      return next();
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      console.warn('⚠️ RECAPTCHA_SECRET_KEY not configured - proceeding');
      return next();
    }

    // Intentar verificación pero NO fallar si hay error de conectividad
    try {
      const verificationUrl = 'https://www.google.com/recaptcha/api/siteverify';
      const response = await axios.post(verificationUrl, null, {
        params: {
          secret: secretKey,
          response: recaptchaToken
        },
        timeout: 5000,
      });

      const { success, score, action } = response.data;
      const threshold = parseFloat(process.env.RECAPTCHA_THRESHOLD) || 0.5;

      if (!success || score < threshold) {
        console.warn(`⚠️ reCAPTCHA check failed: success=${success}, score=${score}`);
        return res.status(403).json({
          exito: false,
          mensaje: 'reCAPTCHA validation failed'
        });
      }

      console.log(`✅ reCAPTCHA valid - Score: ${score}`);
      return next();
    } catch (verifyError) {
      // Error de conectividad o timeout - permitir pero registrar
      console.warn(`⚠️ reCAPTCHA verification failed (${verifyError.code}): ${verifyError.message} - allowing access`);
      return next();
    }

  } catch (error) {
    console.error('❌ Unexpected error in reCAPTCHA middleware:', error.message);
    // No bloquear en caso de error inesperado
    return next();
  }
};

module.exports = verificarRecaptcha;

module.exports = verificarRecaptcha;
