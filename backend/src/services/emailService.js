// Servicio de email para notificaciones de préstamos
// Requiere configurar un servicio de email real como nodemailer

const emailService = {
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
