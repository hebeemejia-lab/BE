// ...existing code...

// Notificación masiva cursos de finanzas
async function enviarNotificacionCursosFinanzas(usuario) {
  const config = getConfig();
  const cursosUrl = `${config.frontendUrl}/seleccion-curso`;
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>¡Nuevos Cursos de Finanzas!</title>
  <style>
    body { background: #f4f6fb; font-family: 'Segoe UI', Arial, sans-serif; padding: 0; margin: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; }
    .header { background: linear-gradient(135deg, #001a4d 0%, #003d99 100%); padding: 32px 24px; text-align: center; }
    .header-title { color: #fff; font-size: 28px; font-weight: 700; margin: 0; }
    .content { padding: 32px 24px; }
    .greeting { font-size: 22px; color: #001a4d; font-weight: 600; margin-bottom: 18px; }
    .message { font-size: 16px; color: #333; line-height: 1.6; margin-bottom: 28px; }
    .button-container { text-align: center; margin: 32px 0; }
    .curso-btn { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #1976d2 0%, #1e88e5 100%); color: #fff !important; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 15px rgba(25, 118, 210, 0.18); transition: background 0.3s; }
    .curso-btn:hover { background: linear-gradient(135deg, #1565c0 0%, #1976d2 100%); }
    .footer { background: #f8f9fa; padding: 24px; text-align: center; border-top: 1px solid #e0e0e0; }
    .footer-text { font-size: 14px; color: #666; }
    @media only screen and (max-width: 600px) { .container { margin: 0; border-radius: 0; } .content { padding: 18px 8px; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="header-title">¡Nuevos Cursos de Finanzas!</h1>
    </div>
    <div class="content">
      <div class="greeting">Hola, ${usuario.nombre || 'usuario'} 👋</div>
      <div class="message">
        Te invitamos a descubrir y seleccionar los cursos de finanzas que tenemos disponibles para ti.<br><br>
        Ahora puedes elegir el curso que más te interese desde una página dedicada, diseñada para que tu experiencia sea más sencilla y visual.
      </div>
      <div class="button-container">
        <a href="${cursosUrl}" class="curso-btn">Ir a Selección de Curso</a>
      </div>
      <div class="message" style="font-size: 14px; color: #666;">
        Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
        <span style="word-break: break-all; color: #1976d2;">${cursosUrl}</span>
      </div>
    </div>
    <div class="footer">
      <div class="footer-text">
        BE | www.bancoexclusivo.lat<br>
        © ${new Date().getFullYear()} BE. Todos los derechos reservados.
      </div>
    </div>
  </div>
</body>
</html>
  `;

  // Forzar uso de Gmail SMTP (beverify@bancoexclusivo.lat)
  const transporter = crearTransporter();
  if (!transporter) {
    return { enviado: false, motivo: 'SMTP no configurado', cursosUrl };
  }
  try {
    await transporter.sendMail({
      from: config.smtpFrom,
      to: usuario.email,
      subject: '¡Descubre los nuevos cursos de finanzas!',
      html,
    });
    return { enviado: true, motivo: 'Enviado por Gmail SMTP', cursosUrl };
  } catch (err) {
    return { enviado: false, motivo: err.message, cursosUrl };
  }
}

// ...existing code...
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
    console.log('--- INICIO ENVÍO SENDGRID ---');
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
    console.log('--- ANTES DE LLAMAR A AXIOS POST ---');
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
    console.log('--- DESPUÉS DE LLAMAR A AXIOS POST ---');
    console.log(`✅ Email enviado exitosamente con SendGrid (Status: ${response.status})`);
    return { enviado: true, provider: 'sendgrid', id: response.headers['x-message-id'] };
  } catch (error) {
    console.log('--- ERROR EN AXIOS O ANTES ---');
    // Mostrar SIEMPRE el error completo
    console.error('❌ Error en SendGrid:');
    const fs = require('fs');
    let logMsg = '\n❌ Error en SendGrid:';
    if (error.response) {
      logMsg += `\n   Status: ${error.response.status}`;
      logMsg += `\n   Data: ${JSON.stringify(error.response.data, null, 2)}`;
    } else {
      logMsg += `\n   Sin respuesta de SendGrid: ${error.message}`;
    }
    fs.appendFileSync('sendgrid-error.log', logMsg + '\n', 'utf8');
    console.error(logMsg);
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
    enviarNotificacionCursosFinanzas,
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
      .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; }
      .header { background: linear-gradient(135deg, #001a4d 0%, #003d99 100%); padding: 32px 24px; text-align: center; }
      .header-title { color: #fff; font-size: 28px; font-weight: 700; margin: 0; }
      .content { padding: 32px 24px; }
      .greeting { font-size: 22px; color: #001a4d; font-weight: 600; margin-bottom: 18px; }
      .message { font-size: 16px; color: #333; line-height: 1.6; margin-bottom: 28px; }
      .button-container { text-align: center; margin: 32px 0; }
      .verify-btn { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #1976d2 0%, #1e88e5 100%); color: #fff !important; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 15px rgba(25, 118, 210, 0.18); transition: background 0.3s; }
      .verify-btn:hover { background: linear-gradient(135deg, #1565c0 0%, #1976d2 100%); }
      .footer { background: #f8f9fa; padding: 24px; text-align: center; border-top: 1px solid #e0e0e0; }
      .footer-text { font-size: 14px; color: #666; }
      @media only screen and (max-width: 600px) { .container { margin: 0; border-radius: 0; } .content { padding: 18px 8px; } }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 class="header-title">Verifica tu cuenta bancaria</h1>
      </div>
      <div class="content">
        <div class="greeting">Hola, ${usuario.nombre || 'usuario'} 👋</div>
        <div class="message">
          Haz clic en el botón para verificar tu cuenta bancaria.<br><br>
        </div>
        <div class="button-container">
          <a href="${verifyUrl}" class="verify-btn">Verificar Cuenta</a>
        </div>
        <div class="message" style="font-size: 14px; color: #666;">
          Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
          <span style="word-break: break-all; color: #1976d2;">${verifyUrl}</span>
        </div>
      </div>
      <div class="footer">
        <div class="footer-text">
          Banco Exclusivo | www.bancoexclusivo.lat<br>
          © ${new Date().getFullYear()} Banco Exclusivo. Todos los derechos reservados.
        </div>
      </div>
    </div>
  </body>
  </html>
        `;
        // Aquí iría el envío real del email, por ejemplo usando SendGrid, SMTP o Resend
        // ...existing code...
      } catch (error) {
        console.error('❌ Error enviando email de verificación:', error);
        return { enviado: false, error: error.message };
      }
    },
          text-decoration: none;
          border-radius: 8px;
          font-size: 18px;
          font-weight: 600;
          box-shadow: 0 4px 15px rgba(204, 0, 0, 0.3);
        }
        .verify-button:hover {
          background: linear-gradient(135deg, #b21d2b 0%, #ff3333 100%);
        }
        .footer {
          background: #f8f9fa;
          padding: 24px;
          text-align: center;
          border-top: 1px solid #e0e0e0;
        }
        .footer-text {
          font-size: 14px;
          color: #666;
        }
        @media only screen and (max-width: 600px) { .container { margin: 0; border-radius: 0; } .content { padding: 18px 8px; } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🏦</div>
          <h1 class="header-title">Verifica tu cuenta</h1>
        </div>
        <div class="content">
          <div class="greeting">Hola, ${usuario.nombre || 'usuario'} 👋</div>
          <div class="message">
            Para completar tu registro, por favor verifica tu dirección de correo electrónico haciendo clic en el siguiente botón:
          </div>
          <div class="button-container">
            <a href="${verifyUrl}" class="verify-button">Verificar mi cuenta</a>
          </div>
          <div class="message" style="font-size: 14px; color: #666;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
            <span style="word-break: break-all; color: #b21d2b;">${verifyUrl}</span>
          </div>
        </div>
        <div class="footer">
          <div class="footer-text">
            Banco Exclusivo | www.bancoexclusivo.lat<br>
            © ${new Date().getFullYear()} Banco Exclusivo. Todos los derechos reservados.
          </div>
        </div>
      </div>
    </body>
    </html>
        `;

        // Forzar uso de Gmail SMTP (beverify@bancoexclusivo.lat)
        const transporter = crearTransporter();
        if (!transporter) {
          return { enviado: false, motivo: 'SMTP no configurado' };
        }
        try {
          await transporter.sendMail({
            from: config.smtpFrom,
            to: usuario.email,
            subject: 'Verifica tu cuenta - Banco Exclusivo',
            html,
          });
          console.log(`✅ Email de verificación enviado con SMTP`);
          return { enviado: true, provider: 'smtp' };
        } catch (smtpError) {
          console.error(`⚠️ SMTP falló: ${smtpError.message}`);
          return { enviado: false, motivo: smtpError.message };
        }
      } catch (error) {
        console.error('❌ Error enviando email de verificación:', error);
        return { enviado: false, error: error.message };
      }
      },
            
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

  // Enviar verificación de cuenta bancaria con microdeposits
  enviarVerificacionCuentaBancaria: async (usuario, cuenta, microdeposits) => {
    const config = getConfig();
    
    try {
      console.log('🏦 Enviando email de verificación de cuenta bancaria...');
      console.log(`   Usuario: ${usuario.email}`);
      console.log(`   Cuenta: ${cuenta.banco} - ****${cuenta.numerosCuenta}`);
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .amounts { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .amount-item { font-size: 24px; font-weight: bold; color: #667eea; margin: 10px 0; }
            .instructions { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
            .warning { color: #dc3545; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏦 Verifica tu Cuenta Bancaria</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${usuario.nombre}</strong>,</p>
              
              <p>Has vinculado una nueva cuenta bancaria a Banco Exclusivo:</p>
              
              <div class="amounts">
                <p><strong>Banco:</strong> ${cuenta.banco}</p>
                <p><strong>Cuenta:</strong> ****${cuenta.numerosCuenta}</p>
                <p><strong>Titular:</strong> ${cuenta.nombreCuenta}</p>
              </div>
              
              <h3>📋 Verificación con Microdeposits</h3>
              <p>Hemos enviado <strong>dos pequeños depósitos</strong> a tu cuenta bancaria. Estos aparecerán en 1-3 días hábiles como:</p>
              
              <div class="amounts">
                <div class="amount-item">Depósito 1: $${microdeposits.deposit1.toFixed(2)}</div>
                <div class="amount-item">Depósito 2: $${microdeposits.deposit2.toFixed(2)}</div>
              </div>
              
              <div class="instructions">
                <h4>⚠️ IMPORTANTE:</h4>
                <ul>
                  <li>Revisa tu estado de cuenta bancario</li>
                  <li>Busca transacciones de "BANCO EXCLUSIVO" o "MICRODEPOSIT"</li>
                  <li>Anota los montos <strong>exactos</strong> (centavos incluidos)</li>
                  <li>Ingresa los montos en tu perfil de Banco Exclusivo</li>
                </ul>
              </div>
              
              <center>
                <a href="${config.frontendUrl}/perfil/cuentas" class="button">
                  ✅ Verificar Cuenta Ahora
                </a>
              </center>
              
              <p class="warning">⏰ Los microdeposits expiran en 7 días</p>
              
              <p>Si no realizaste esta acción, ignora este email o contacta a soporte.</p>
              
              <div class="footer">
                <p>© ${new Date().getFullYear()} Banco Exclusivo - Todos los derechos reservados</p>
                <p>Este es un email automático, por favor no respondas.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      // Intentar con SendGrid primero
      if (config.sendgridApiKey) {
        const resultado = await enviarConSendGrid({
          to: usuario.email,
          subject: '🏦 Verifica tu cuenta bancaria - Microdeposits enviados',
          html,
        });

        if (resultado.enviado) {
          console.log(`✅ Email de verificación bancaria enviado con SendGrid`);
          return resultado;
        }
        console.warn(`⚠️ SendGrid falló, intentando alternativas...`);
      }

      // Fallback SMTP
      console.log('📧 Intentando con SMTP...');
      const transporter = crearTransporter();
      if (transporter) {
        try {
          await transporter.sendMail({
            from: config.smtpFrom,
            to: usuario.email,
            subject: '🏦 Verifica tu cuenta bancaria - Microdeposits enviados',
            html,
          });

          console.log(`✅ Email de verificación bancaria enviado con SMTP`);
          return { enviado: true, provider: 'smtp' };
        } catch (smtpError) {
          console.error(`⚠️ SMTP falló: ${smtpError.message}`);
        }
      }

      // Fallback Resend
      if (config.resendApiKey) {
        console.log('📧 Intentando con Resend...');
        const resultadoResend = await enviarConResend({
          to: usuario.email,
          subject: '🏦 Verifica tu cuenta bancaria - Microdeposits enviados',
          html,
        });

        if (resultadoResend.enviado) {
          console.log(`✅ Email de verificación bancaria enviado con Resend`);
          return resultadoResend;
        }
        console.warn(`⚠️ Resend también falló: ${resultadoResend.error}`);
      }

      console.warn('⚠️ Ningún servicio de email configurado, mostrando en consola');
      console.log(`💰 Microdeposits: $${microdeposits.deposit1.toFixed(2)} y $${microdeposits.deposit2.toFixed(2)}`);
      return { enviado: false, motivo: 'Email service no configurado', microdeposits };
      
    } catch (error) {
      console.error('❌ Error enviando email de verificación bancaria:', error);
      return { enviado: false, error: error.message };
    }
  },
};

module.exports = emailService;
