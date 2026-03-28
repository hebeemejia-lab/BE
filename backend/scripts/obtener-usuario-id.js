// Script para obtener el usuarioId a partir del email
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
if (!process.env.DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL no está configurado. Verifica tu archivo .env.');
}
const { User } = require('../src/models');

async function obtenerUsuarioIdPorEmail(email) {
  if (!email) {
    console.error('Debes indicar el email como argumento. Ejemplo: node obtener-usuario-id.js correo@dominio.com');
    process.exit(1);
  }
  const user = await User.findOne({ where: { email } });
  if (!user) {
    console.log('No se encontró usuario con ese email.');
    return;
  }
  console.log(`UsuarioId para ${email}:`, user.id);
}

const emailArg = process.argv[2];
obtenerUsuarioIdPorEmail(emailArg);
