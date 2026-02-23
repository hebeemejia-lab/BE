const sgMail = require('@sendgrid/mail');
const plantillaAhorro = require('./plantilla-ahorro-exclusivo');

const plantillaCursos = {
  subject: '¡Descubre los nuevos cursos de finanzas!',
  html: `
    <div style="font-family: Arial, sans-serif; background: #f4f6fb; padding: 32px;">
      <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px #e0e0e0; padding: 32px;">
        <h2 style="color: #1976d2;">Nuevos Cursos de Finanzas</h2>
        <p style="font-size: 16px; color: #333;">Te invitamos a descubrir y seleccionar los cursos de finanzas que tenemos disponibles para ti. Ahora puedes elegir el curso que más te interese desde una página dedicada, diseñada para que tu experiencia sea más sencilla y visual.</p>
        <a href="https://bancoexclusivo.com/seleccion-curso" style="display: inline-block; background: #1976d2; color: #fff; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold;">Ir a Selección de Curso</a>
        <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 14px; color: #888;">Banco Exclusivo &copy; 2026 | Este mensaje es informativo. Si tienes dudas, contáctanos.</p>
      </div>
    </div>
  `
};

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const correos = [
  'hebelmejia2@gmail.com'
];

async function enviarCorreos() {
  console.log(`Enviando correos a ${correos.length} destinatarios...`);
  for (const to of correos) {
    // Enviar plantilla de ahorro exclusivo
    const msgAhorro = {
      to,
      from: 'info@bancoexclusivo.com',
      subject: plantillaAhorro.subject,
      html: plantillaAhorro.html,
    };
    // Enviar plantilla de cursos de finanzas
    const msgCursos = {
      to,
      from: 'info@bancoexclusivo.com',
      subject: plantillaCursos.subject,
      html: plantillaCursos.html,
    };
    try {
      await sgMail.send(msgAhorro);
      console.log(`Correo de ahorro enviado a: ${to}`);
      await sgMail.send(msgCursos);
      console.log(`Correo de cursos enviado a: ${to}`);
    } catch (error) {
      console.error(`Error enviando a ${to}:`, error.response ? error.response.body : error);
    }
  }
}

enviarCorreos();
