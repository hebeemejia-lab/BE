require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function enviarCorreoPrueba() {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: 'hebeemejia@gmail.com',
    subject: 'Prueba de envío SMTP Gmail (desde beverify@bancoexclusivo.lat)',
    text: 'Este es un correo de prueba enviado usando Gmail SMTP como remitente beverify@bancoexclusivo.lat.',
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Correo de prueba enviado:', info.response);
  } catch (err) {
    console.error('Error enviando correo de prueba:', err.message);
  }
}

enviarCorreoPrueba();