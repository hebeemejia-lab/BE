const { User } = require('./src/models');
const emailService = require('./src/services/emailService');

async function asignarCursosTodosUsuarios() {
  try {
    const usuarios = await User.findAll();
    let enviados = 0;
    for (const usuario of usuarios) {
      const resultado = await emailService.enviarNotificacionCursosFinanzas(usuario);
      if (resultado.enviado) enviados++;
      else console.warn(`No enviado a ${usuario.email}: ${resultado.motivo}`);
    }
    console.log(`Cursos enviados a ${enviados} usuarios de ${usuarios.length}`);
  } catch (err) {
    console.error('Error asignando cursos:', err);
  }
}

asignarCursosTodosUsuarios();
