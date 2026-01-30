require('dotenv').config();
const { sequelize, User } = require('./src/models');
const emailService = require('./src/services/emailService');
const crypto = require('crypto');

async function enviarVerificacionMasiva() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a la base de datos');

    // Buscar todos los usuarios no verificados
    const usuariosNoVerificados = await User.findAll({
      where: {
        emailVerificado: false
      }
    });

    console.log(`\n📧 Encontrados ${usuariosNoVerificados.length} usuarios sin verificar\n`);

    if (usuariosNoVerificados.length === 0) {
      console.log('✅ Todos los usuarios ya están verificados');
      process.exit(0);
    }

    let enviados = 0;
    let errores = 0;

    for (const usuario of usuariosNoVerificados) {
      try {
        // Generar nuevo token de verificación
        const token = crypto.randomBytes(32).toString('hex');
        const expiracion = new Date();
        expiracion.setHours(expiracion.getHours() + 24); // Token válido por 24 horas

        // Actualizar usuario con el nuevo token
        await usuario.update({
          emailVerificationToken: token,
          emailVerificationExpires: expiracion
        });

        // Enviar correo
        await emailService.enviarVerificacionEmail(usuario.email, token, usuario.nombre);
        
        enviados++;
        console.log(`✅ ${enviados}/${usuariosNoVerificados.length} - Enviado a: ${usuario.email}`);
      } catch (error) {
        errores++;
        console.error(`❌ Error enviando a ${usuario.email}:`, error.message);
      }
    }

    console.log('\n==============================================');
    console.log(`📊 Resumen:`);
    console.log(`   Total usuarios: ${usuariosNoVerificados.length}`);
    console.log(`   Enviados exitosamente: ${enviados}`);
    console.log(`   Errores: ${errores}`);
    console.log('==============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

enviarVerificacionMasiva();
