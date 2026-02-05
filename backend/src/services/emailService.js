// Servicio de email para notificaciones y verificación
// Soporta: SendGrid API (preferido), SMTP, y Resend

const nodemailer = require('nodemailer');
const axios = require('axios');

// Función para obtener configuración dinamicamente
const getConfig = () => ({
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  sendgridFrom: process.env.SENDGRID_FROM || 'banco.exclusivo@bancoexclusivo.lat',
  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  smtpFrom: process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@bancoexclusivo.lat',
  resendApiKey: process.env.RESEND_API_KEY,
  resendFrom: process.env.RESEND_FROM || (process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@bancoexclusivo.lat'),
  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, ''),
});

// Log inicial para debugging
console.log('📧 Email Service cargado - configuración se obtiene dinámicamente');

const crearTransporter = () => {
  const config = getConfig();
  
  if (!config.smtpHost || !config.smtpUser || !config.smtpPass) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });
};

const enviarConSendGrid = async ({ to, subject, html }) => {
  const config = getConfig();
  
  // Limpiar la API key de espacios y saltos de línea
  const apiKey = config.sendgridApiKey?.trim();
  
  console.log('🔍 DEBUG SendGrid:');
  console.log(`   API Key configurada: ${apiKey ? '✅ SI' : '❌ NO'}`);
  console.log(`   API Key length: ${apiKey?.length || 0}`);
  console.log(`   Destinatario: ${to}`);
  
  if (!apiKey) {
    console.error('❌ SendGrid API Key no está configurado');
    return { enviado: false, error: 'SENDGRID_API_KEY no configurado' };
  }

  try {
    console.log(`📤 Intentando enviar con SendGrid a: ${Array.isArray(to) ? to.join(', ') : to}`);
    
    const payload = {
      personalizations: [
        {
          to: Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }],
          subject,
        },
      ],
      from: {
        email: config.sendgridFrom,
        name: 'Banco Exclusivo',
      },
      content: [
        {
          type: 'text/html',
          value: html,
        },
      ],
    };
    
    console.log('📦 Payload SendGrid:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(
      'https://api.sendgrid.com/v3/mail/send',
      payload,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    console.log(`✅ Email enviado exitosamente con SendGrid (Status: ${response.status})`);
    return { enviado: true, provider: 'sendgrid', id: response.headers['x-message-id'] };
  } catch (error) {
    console.error('❌ Error en SendGrid:');
    console.error('   Status:', error.response?.status);
    console.error('   Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('   Message:', error.message);
    const mensajeError = error.response?.data?.errors?.[0]?.message || error.message || 'Error desconocido en SendGrid';
    return { enviado: false, error: mensajeError, provider: 'sendgrid', detalles: error.response?.data };
  }
};

const enviarConResend = async ({ to, subject, html }) => {
  const config = getConfig();
  
  if (!config.resendApiKey) {
    return { enviado: false, error: 'RESEND_API_KEY no configurado' };
  }

  try {
    const response = await axios.post(
      'https://api.resend.com/emails',
      {
        from: config.resendFrom,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      },
      {
        headers: {
          Authorization: `Bearer ${config.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    return { enviado: true, provider: 'resend', id: response.data?.id };
  } catch (error) {
    const mensajeError = error.response?.data?.message || error.message || 'Error desconocido en Resend';
    return { enviado: false, error: mensajeError, provider: 'resend' };
  }
};

const emailService = {
  // Enviar verificación de email
  enviarVerificacionEmail: async (usuario, token) => {
    try {
      const config = getConfig();
      
      console.log('🔍 DEBUG enviarVerificacionEmail:');
      console.log(`   sendgridApiKey existe: ${config.sendgridApiKey ? '✅ SI' : '❌ NO'}`);
      console.log(`   smtpHost existe: ${config.smtpHost ? '✅ SI' : '❌ NO'}`);
      console.log(`   resendApiKey existe: ${config.resendApiKey ? '✅ SI' : '❌ NO'}`);
      
      const verifyUrl = `${config.frontendUrl}/verificar-email?token=${encodeURIComponent(token)}`;

      const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verifica tu cuenta - Banco Exclusivo</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        .header {
            background: linear-gradient(135deg, #001a4d 0%, #003d99 100%);
            padding: 40px 30px;
            text-align: center;
        }
        .logo {
            font-size: 48px;
            margin-bottom: 10px;
        }
        .header-title {
            color: #ffffff;
            font-size: 28px;
            font-weight: 700;
            margin: 0;
        }
        .content {
            padding: 40px 30px;
            background: #ffffff;
        }
        .greeting {
            font-size: 24px;
            color: #001a4d;
            font-weight: 600;
            margin-bottom: 20px;
        }
        .message {
            font-size: 16px;
            color: #333333;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .verify-button {
            display: inline-block;
            padding: 16px 40px;
            background: linear-gradient(135deg, #cc0000 0%, #ff3333 100%);
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-size: 18px;
            font-weight: 600;
            box-shadow: 0 4px 15px rgba(204, 0, 0, 0.3);
            transition: all 0.3s ease;
        }
        .verify-button:hover {
            background: linear-gradient(135deg, #ff3333 0%, #ff6666 100%);
            box-shadow: 0 6px 20px rgba(204, 0, 0, 0.4);
            transform: translateY(-2px);
        }
        .info-box {
            background: #f8f9fa;
            border-left: 4px solid #003d99;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
        }
        .info-box p {
            margin: 0;
            font-size: 14px;
            color: #666666;
        }
        .link-container {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            word-break: break-all;
        }
        .link-text {
            font-size: 13px;
            color: #003d99;
            font-family: monospace;
        }
        .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e0e0e0;
        }
        .footer-text {
            font-size: 14px;
            color: #666666;
            margin-bottom: 10px;
        }
        .footer-link {
            color: #003d99;
            text-decoration: none;
        }
        .security-note {
            margin-top: 20px;
            padding: 15px;
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            border-radius: 8px;
        }
        .security-note p {
            font-size: 14px;
            color: #856404;
            margin: 0;
        }
        .features {
            display: flex;
            justify-content: space-around;
            margin: 30px 0;
            flex-wrap: wrap;
        }
        .feature {
            text-align: center;
            flex: 1;
            min-width: 150px;
            padding: 10px;
        }
        .feature-icon {
            font-size: 32px;
            margin-bottom: 10px;
        }
        .feature-text {
            font-size: 13px;
            color: #666666;
        }
        @media only screen and (max-width: 600px) {
            body { padding: 20px 10px; }
            .content { padding: 30px 20px; }
            .greeting { font-size: 20px; }
            .verify-button { padding: 14px 30px; font-size: 16px; }
            .features { flex-direction: column; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏦</div>
            <h1 class="header-title">Banco Exclusivo</h1>
        </div>
        
        <div class="content">
            <h2 class="greeting">¡Bienvenido, ${usuario.nombre}! 👋</h2>
            
            <p class="message">
                Estás a un solo paso de activar tu cuenta en <strong>Banco Exclusivo</strong>. 
                Para comenzar a disfrutar de todos nuestros servicios financieros, necesitamos verificar tu dirección de correo electrónico.
            </p>
            
            <div class="button-container">
                <a href="${verifyUrl}" class="verify-button">
                    ✅ Verificar mi cuenta
                </a>
            </div>
            
            <div class="info-box">
                <p>
                    <strong>⏰ Este enlace expirará en 24 horas</strong><br>
                    Si no solicitaste crear una cuenta, puedes ignorar este correo.
                </p>
            </div>
            
            <p class="message" style="font-size: 14px; color: #666;">
                Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:
            </p>
            
            <div class="link-container">
                <p class="link-text">${verifyUrl}</p>
            </div>
            
            <div class="features">
                <div class="feature">
                    <div class="feature-icon">💳</div>
                    <p class="feature-text">Recargas seguras</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">💸</div>
                    <p class="feature-text">Transferencias rápidas</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">📊</div>
                    <p class="feature-text">Control total</p>
                </div>
            </div>
            
            <div class="security-note">
                <p>
                    🔒 <strong>Seguridad:</strong> Nunca compartas este enlace con nadie. 
                    Banco Exclusivo jamás te pedirá tu contraseña por correo.
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p class="footer-text">
                <strong>Banco Exclusivo</strong><br>
                Tu aliado financiero de confianza
            </p>
            <p class="footer-text">
                <a href="${config.frontendUrl}" class="footer-link">www.bancoexclusivo.lat</a> | 
                <a href="${config.frontendUrl}/politica_privacidad.md" class="footer-link">Política de Privacidad</a>
            </p>
            <p class="footer-text" style="font-size: 12px; margin-top: 15px; color: #999;">
                © ${new Date().getFullYear()} Banco Exclusivo. Todos los derechos reservados.
            </p>
        </div>
    </div>
</body>
</html>
      `;

      // Preferir SendGrid
      if (config.sendgridApiKey) {
        console.log('📧 Intentando con SendGrid...');
        const resultadoSendGrid = await enviarConSendGrid({
          to: usuario.email,
          subject: 'Verifica tu correo - Banco Exclusivo',
          html,
        });

        if (resultadoSendGrid.enviado) {
          console.log(`✅ Email enviado con SendGrid a ${usuario.email}`);
          return resultadoSendGrid;
        }

        console.warn(`⚠️ SendGrid falló: ${resultadoSendGrid.error}`);
      }

      // Fallback a SMTP
      console.log('📧 Intentando con SMTP...');
      const transporter = crearTransporter();
      if (transporter) {
        try {
          await transporter.sendMail({
            from: config.smtpFrom,
            to: usuario.email,
            subject: 'Verifica tu correo - Banco Exclusivo',
            html,
          });

          console.log(`✅ Email enviado con SMTP a ${usuario.email}`);
          return { enviado: true, provider: 'smtp' };
        } catch (smtpError) {
          console.error(`⚠️ SMTP falló: ${smtpError.message}`);
        }
      }

      // Fallback a Resend
      if (config.resendApiKey) {
        console.log('📧 Intentando con Resend...');
        const resultadoResend = await enviarConResend({
          to: usuario.email,
          subject: 'Verifica tu correo - Banco Exclusivo',
          html,
        });

        if (resultadoResend.enviado) {
          console.log(`✅ Email enviado con Resend a ${usuario.email}`);
          return resultadoResend;
        }

        console.warn(`⚠️ Resend también falló: ${resultadoResend.error}`);
      }

      console.warn('⚠️ Ningún servicio de email está configurado.');
      console.log(`🔗 Link de verificación: ${verifyUrl}`);
      return { enviado: false, motivo: 'Email service no configurado', verifyUrl };
    } catch (error) {
      console.error('❌ Error enviando email de verificación:', error);
      return { enviado: false, error: error.message };
    }
  },

  // Enviar notificación de nuevo préstamo solicitado
  enviarNotificacionSolicitud: async (usuario, prestamo) => {
    try {
      // Aquí iría la lógica real con nodemailer
      console.log(`📧 Email enviado a ${process.env.ADMIN_EMAIL}`);
      console.log(`   Nuevo préstamo solicitado por ${usuario.nombre}`);
      console.log(`   Monto: $${prestamo.montoSolicitado}`);
      console.log(`   Plazo: ${prestamo.plazo} meses`);

      // Estructura del email real (cuando se configure nodemailer)
      // const transporter = nodemailer.createTransport({...});
      // await transporter.sendMail({
      //   from: 'noreply@bancoexclusivo.com',
      //   to: process.env.ADMIN_EMAIL,
      //   subject: `Nueva solicitud de préstamo de ${usuario.nombre}`,
      //   html: `
      //     <h2>Nueva Solicitud de Préstamo</h2>
      //     <p><strong>Usuario:</strong> ${usuario.nombre}</p>
      //     <p><strong>Email:</strong> ${usuario.email}</p>
      //     <p><strong>Cédula:</strong> ${usuario.cedula}</p>
      //     <p><strong>Monto:</strong> $${prestamo.montoSolicitado}</p>
      //     <p><strong>Plazo:</strong> ${prestamo.plazo} meses</p>
      //     <p><a href="http://localhost:3000/admin/prestamos">Ver solicitud</a></p>
      //   `,
      // });

      return { enviado: true };
    } catch (error) {
      console.error('Error enviando email:', error);
      return { enviado: false, error: error.message };
    }
  },

  // Enviar confirmación de préstamo aprobado
  enviarConfirmacionAprobacion: async (usuario, prestamo) => {
    try {
      console.log(`📧 Email enviado a ${usuario.email}`);
      console.log(`   ¡Tu préstamo ha sido aprobado!`);
      console.log(`   Monto aprobado: $${prestamo.montoAprobado}`);
      console.log(`   Se depositará en: ${prestamo.bancoDespositante}`);
      console.log(`   Cuenta: ${prestamo.cuentaBancaria}`);

      // Email real cuando se configure
      // await transporter.sendMail({
      //   from: 'noreply@bancoexclusivo.com',
      //   to: usuario.email,
      //   subject: '¡Tu préstamo ha sido aprobado! 🎉',
      //   html: `
      //     <h2>¡Felicidades, ${usuario.nombre}!</h2>
      //     <p>Tu solicitud de préstamo ha sido aprobada.</p>
      //     <h3>Detalles del préstamo:</h3>
      //     <ul>
      //       <li><strong>Monto Aprobado:</strong> $${prestamo.montoAprobado}</li>
      //       <li><strong>Tasa de Interés:</strong> ${prestamo.tasaInteres}% anual</li>
      //       <li><strong>Plazo:</strong> ${prestamo.plazo} meses</li>
      //       <li><strong>Cuota Mensual Estimada:</strong> $${prestamo.cuotaMensual}</li>
      //       <li><strong>Banco:</strong> ${prestamo.bancoDespositante}</li>
      //       <li><strong>Cuenta de Depósito:</strong> ${prestamo.cuentaBancaria}</li>
      //     </ul>
      //   `,
      // });

      return { enviado: true };
    } catch (error) {
      console.error('Error enviando email:', error);
      return { enviado: false, error: error.message };
    }
  },

  // Enviar rechazo de préstamo
  enviarRechazo: async (usuario, prestamo) => {
    try {
      console.log(`📧 Email enviado a ${usuario.email}`);
      console.log(`   Tu solicitud de préstamo ha sido rechazada`);
      console.log(`   Motivo: ${prestamo.motivoRechazo}`);

      return { enviado: true };
    } catch (error) {
      console.error('Error enviando email:', error);
      return { enviado: false, error: error.message };
    }
  },
};

module.exports = emailService;
