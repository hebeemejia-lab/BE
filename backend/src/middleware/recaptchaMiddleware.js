const axios = require('axios');

/**
 * Middleware para validar reCAPTCHA v3
 * Verifica el token de reCAPTCHA enviado desde el frontend
 */
const verificarRecaptcha = async (req, res, next) => {
  try {
    const recaptchaToken = req.body.recaptchaToken;

    // Si no hay token de reCAPTCHA, permitir (el usuario puede no haber podido ejecutar reCAPTCHA)
    if (!recaptchaToken) {
      console.warn('⚠️ Token de reCAPTCHA no proporcionado - Continuando sin validación');
      return next();
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      console.error('❌ RECAPTCHA_SECRET_KEY no está configurado');
      console.warn('⚠️ Saltando validación de reCAPTCHA (clave no configurada)');
      return next();
    }

    // Intentar verificar con endpoints alternativos
    const verificationUrls = [
      'https://www.google.com/recaptcha/api/siteverify',
      'https://recaptcha.net/recaptcha/api/siteverify',
    ];

    let lastError = null;
    for (const verificationUrl of verificationUrls) {
      try {
        const response = await axios.post(verificationUrl, null, {
          params: {
            secret: secretKey,
            response: recaptchaToken
          },
          timeout: 5000,
        });

        const { success, score, action } = response.data;
        const threshold = parseFloat(process.env.RECAPTCHA_THRESHOLD) || 0.5;

        console.log(`✅ reCAPTCHA verificado (${verificationUrl}) - Score: ${score}, Action: ${action}, Threshold: ${threshold}`);

        // Validar respuesta
        if (!success) {
          console.warn('⚠️ reCAPTCHA falló: Token inválido o expirado');
          return res.status(400).json({
            exito: false,
            mensaje: 'Verificación de reCAPTCHA fallida. Por favor, intenta de nuevo.'
          });
        }

        // Validar puntuación (0 = bot, 1 = humano)
        if (score < threshold) {
          console.warn(`⚠️ reCAPTCHA Score bajo (${score}). Posible bot o actividad sospechosa.`);
          return res.status(403).json({
            exito: false,
            mensaje: 'No pudimos verificar que eres humano. Por favor, intenta de nuevo.'
          });
        }

        // Validar que la acción sea correcta (en este caso 'login')
        if (action !== 'login') {
          console.warn(`⚠️ Acción de reCAPTCHA incorrecta: ${action}`);
          return res.status(400).json({
            exito: false,
            mensaje: 'Validación de reCAPTCHA fallida. Por favor, intenta de nuevo.'
          });
        }

        // ✅ reCAPTCHA válido, continuar
        console.log(`✅ reCAPTCHA válido - Score: ${score}`);
        return next();
      } catch (err) {
        lastError = err;
        console.warn(`⚠️ reCAPTCHA verification failed with ${verificationUrl}:`, err.message);
        // Continuar con el siguiente endpoint
      }
    }

    // Si todos los endpoints fallan por conectividad, permitir pero registrar warning
    console.error('❌ All reCAPTCHA endpoints failed:', lastError?.message);
    if (lastError?.code === 'ECONNREFUSED' || lastError?.code === 'ETIMEDOUT' || lastError?.code === 'ENOTFOUND') {
      console.warn('⚠️ reCAPTCHA verification failed due to network issues, allowing access');
      return next();
    }

    // Si es otro tipo de error, rechazar
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al verificar reCAPTCHA. Por favor, intenta de nuevo.'
    });

  } catch (error) {
    console.error('❌ Error verificando reCAPTCHA:', error.message);
    
    // Si es un error de conectividad, permitir
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      console.warn('⚠️ reCAPTCHA verification failed due to network issues, allowing access');
      return next();
    }

    return res.status(500).json({
      exito: false,
      mensaje: 'Error al verificar reCAPTCHA. Por favor, intenta de nuevo.'
    });
  }
};

module.exports = verificarRecaptcha;
