require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const nodemailer = require('nodemailer');
const plantillaCursos = {
  subject: '¡Descubre los nuevos cursos de finanzas!',
  html: `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6fb; padding: 32px;">
      <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden;">
        <div style="background: linear-gradient(90deg, #1976d2 0%, #43a047 100%); padding: 32px 0; text-align: center;">
          <div style="display: flex; flex-direction: column; align-items: center;">
            <div style="position: relative; display: inline-block;">
              <img src='https://www.bancoexclusivo.lat/imagen/BE%20(7)%20(1).png' alt='BE' style='width: 64px; height: 64px; margin-bottom: 8px; border-radius: 50%; object-fit: cover;'/>
              <span style="position: absolute; bottom: 6px; right: 2px; background: #fff; border-radius: 50%; padding: 0; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 4px #1976d2;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#1976d2" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="12" fill="#1976d2"/>
                  <path d="M17 9l-5.2 5.2-2.8-2.8" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                </svg>
              </span>
            </div>
            <h2 style="color: #fff; margin: 0; font-size: 28px;">Nuevos Cursos de Finanzas</h2>
          </div>
        </div>
        <div style="padding: 32px;">
          <p style="font-size: 17px; color: #222; margin-bottom: 18px;">Te invitamos a descubrir y seleccionar los cursos de finanzas que tenemos disponibles para ti. Ahora puedes elegir el curso que más te interese desde una página dedicada, diseñada para que tu experiencia sea más sencilla y visual.</p>
          <a href="https://www.bancoexclusivo.lat/seleccion-curso" style="display: inline-block; background: #1976d2; color: #fff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; margin-bottom: 18px;">Ir a Selección de Curso</a>
        </div>
        <div style="background: #f1f3f4; padding: 18px 32px; text-align: center; font-size: 13px; color: #888; border-radius: 0 0 16px 16px;">
          BE &copy; 2026 | Este mensaje es informativo.<br>
          <span style="color:#1976d2;">Enviado desde Gmail seguro</span>
        </div>
      </div>
    </div>
  `
};
const { User } = require('./src/models/User');

const transporterCursos = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_CURSOS_USER,
    pass: process.env.SMTP_CURSOS_PASS,
  },
});

async function obtenerCorreosUsuarios() {
  try {
    const usuarios = await User.findAll({ attributes: ['email'], where: { emailVerificado: true } });
    return usuarios.map(u => u.email);
  } catch (err) {
    console.error('Error obteniendo correos:', err);
    return [];
  }
}

async function enviarCursosMasivo() {
  const correos = await obtenerCorreosUsuarios();
  console.log(`Enviando plantilla de cursos a ${correos.length} destinatarios...`);
  for (const to of correos) {
    const msgCursos = {
      to,
      from: process.env.SMTP_CURSOS_FROM,
      subject: plantillaCursos.subject,
      html: plantillaCursos.html,
    };
    try {
      await transporterCursos.sendMail(msgCursos);
      console.log(`Correo de cursos enviado a: ${to}`);
    } catch (err) {
      console.error(`Error enviando a ${to}:`, err.message);
    }
  }
}

enviarCursosMasivo();
