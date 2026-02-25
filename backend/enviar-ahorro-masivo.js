require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const nodemailer = require('nodemailer');
const plantillaAhorro = require('./plantilla-ahorro-exclusivo');
const { User } = require('./src/models/User');

const transporterAhorro = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
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

async function enviarAhorroMasivo() {
  const correos = await obtenerCorreosUsuarios();
  console.log(`Enviando plantilla de ahorro a ${correos.length} destinatarios...`);
  for (const to of correos) {
    const msgAhorro = {
      to,
      from: process.env.SMTP_FROM,
      subject: plantillaAhorro.subject,
      html: plantillaAhorro.html,
    };
    try {
      await transporterAhorro.sendMail(msgAhorro);
      console.log(`Correo de ahorro enviado a: ${to}`);
    } catch (err) {
      console.error(`Error enviando a ${to}:`, err.message);
    }
  }
}

enviarAhorroMasivo();
