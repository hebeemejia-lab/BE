require('dotenv').config();
const { sequelize, User } = require('./src/models');
const emailService = require('./src/services/emailService');

async function notificarCursosFinanzas() {
    // Mostrar valores de variables de entorno relevantes
    console.log('DEBUG ENV:');
    console.log('  SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY.substring(0, 10) + '...' : 'NO DEFINIDA');
    console.log('  SENDGRID_FROM:', process.env.SENDGRID_FROM);
    console.log('  .env path esperado:', require('path').resolve(__dirname, '.env'));
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a la base de datos');

    // Enviar a todos los usuarios registrados
    const usuarios = await User.findAll({ attributes: ['email', 'nombre'], where: { emailVerificado: true } });
    console.log(`\n📧 Enviando notificación de cursos a ${usuarios.length} usuarios registrados con email verificado...\n`);
    let enviados = 0;
    let errores = 0;
    for (const usuario of usuarios) {
      try {
        const resultado = await emailService.enviarNotificacionCursosFinanzas(usuario);
        if (resultado && resultado.enviado) {
          enviados++;
          console.log(`✅ Notificado: ${usuario.email} | Proveedor: ${resultado.provider || 'desconocido'} | ID: ${resultado.id || '-'}`);
        } else {
          errores++;
          console.error(`❌ Error notificando a ${usuario.email}:`, resultado && resultado.error ? resultado.error : JSON.stringify(resultado));
        }
      } catch (error) {
        errores++;
        console.error(`❌ Error notificando a ${usuario.email}:`, error.message);
      }
    }

    console.log('\n==============================================');
    console.log(`📊 Resumen:`);
    console.log(`   Total usuarios: ${usuarios.length}`);
    console.log(`   Notificados exitosamente: ${enviados}`);
    console.log(`   Errores: ${errores}`);
    console.log('==============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

notificarCursosFinanzas();
