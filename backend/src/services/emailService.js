// ...existing code...

// Notificación masiva cursos de finanzas
async function enviarNotificacionCursosFinanzas(usuario) {
  const config = getConfig();
  const cursosUrl = `${config.frontendUrl}/seleccion-curso`;
  const html = `...existing code...`;

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
        const html = `...existing code...`;
        // ...existing code...
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
  // Enviar confirmación de préstamo aprobado al usuario
  enviarConfirmacionAprobacion: async (usuario, prestamo) => {
    try {
      console.log(`📧 Email enviado a ${usuario.email}`);
      console.log(`   Tu préstamo ha sido aprobado`);
      console.log(`   Monto: $${prestamo.montoAprobado}`);
      console.log(`   Cuota mensual: $${prestamo.cuotaMensual}`);
      return { enviado: true };
    } catch (error) {
      console.error('Error enviando email de aprobación:', error);
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
  }
};

module.exports = emailService;
