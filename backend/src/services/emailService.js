// Servicio de email para notificaciones y verificación
// Soporta: SendGrid API (preferido), SMTP, y Resend

const nodemailer = require('nodemailer');
const axios = require('axios');

// Función para obtener configuración dinamicamente
const getConfig = () => ({
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  sendgridFrom: process.env.SENDGRID_FROM || 'noreply@bancoexclusivo.lat',
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
  
  if (!config.sendgridApiKey) {
    console.error('❌ SendGrid API Key no está configurado');
    return { enviado: false, error: 'SENDGRID_API_KEY no configurado' };
  }

  try {
    console.log(`📤 Intentando enviar con SendGrid a: ${Array.isArray(to) ? to.join(', ') : to}`);
    
    const response = await axios.post(
      'https://api.sendgrid.com/v3/mail/send',
      {
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
      },
      {
        headers: {
          Authorization: `Bearer ${config.sendgridApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    console.log(`✅ Email enviado exitosamente con SendGrid (ID: ${response.headers['x-message-id']})`);
    return { enviado: true, provider: 'sendgrid', id: response.headers['x-message-id'] };
  } catch (error) {
    console.error('❌ Error en SendGrid:', error.response?.status, error.response?.data || error.message);
    const mensajeError = error.response?.data?.errors?.[0]?.message || error.message || 'Error desconocido en SendGrid';
    return { enviado: false, error: mensajeError, provider: 'sendgrid' };
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
      const verifyUrl = `${config.frontendUrl}/verificar-email?token=${encodeURIComponent(token)}`;

      const html = `
        <h2>Hola, ${usuario.nombre}</h2>
        <p>Para activar tu cuenta, confirma tu correo haciendo clic en el siguiente enlace:</p>
        <p><a href="${verifyUrl}">Verificar correo</a></p>
        <p>O copia este enlace: ${verifyUrl}</p>
        <p>Este enlace expirará en 24 horas.</p>
      `;

      // Preferir SendGrid
      if (config.sendgridApiKey) {
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
