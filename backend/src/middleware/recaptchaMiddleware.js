const axios = require('axios');

/**
 * Middleware para validar reCAPTCHA v3
 * Verifica el token de reCAPTCHA enviado desde el frontend
 */
const verificarRecaptcha = async (req, res, next) => {
  try {
    const recaptchaToken = req.body.recaptchaToken;

    if (!recaptchaToken) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Token de reCAPTCHA no proporcionado'
      });
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      console.error('❌ RECAPTCHA_SECRET_KEY no está configurado');
      // En desarrollo, permitir el acceso sin reCAPTCHA
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Saltando validación de reCAPTCHA en desarrollo');
        return next();
      }
      return res.status(500).json({
        exito: false,
        mensaje: 'Configuración de reCAPTCHA incompleta'
      });
    }

    // Verificar el token con Google
    const verificationUrl = 'https://www.google.com/recaptcha/api/siteverify';
    const response = await axios.post(verificationUrl, null, {
      params: {
        secret: secretKey,
        response: recaptchaToken
      }
    });

    const { success } = response.data;
    if (!success) {
      console.warn('⚠️ reCAPTCHA falló: Token inválido o expirado');
      return res.status(400).json({
        exito: false,
        mensaje: 'Verificación de reCAPTCHA fallida. Por favor, intenta de nuevo.'
      });
    }
    // ✅ reCAPTCHA válido, continuar con la siguiente función
    console.log(`✅ reCAPTCHA v2 válido`);
    next();

  } catch (error) {
    console.error('❌ Error verificando reCAPTCHA:', error.message);
    
    // En caso de error, decidir si permitir o rechazar
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Error de reCAPTCHA en desarrollo, permitiendo acceso');
      return next();
    }

    return res.status(500).json({
      exito: false,
      mensaje: 'Error al verificar reCAPTCHA. Por favor, intenta de nuevo.'
    });
  }
};

module.exports = verificarRecaptcha;
