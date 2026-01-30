const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const { sequelize } = require('./src/config/database');

async function crearUsuarioAdmin() {
  try {
    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log('✅ Conexión a base de datos exitosa');

    // Sincronizar modelos (agregar columna rol si no existe)
    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados');

    // Verificar si ya existe el admin
    const adminExistente = await User.findOne({ 
      where: { email: 'admin@bancoexclusivo.lat' } 
    });

    if (adminExistente) {
      console.log('⚠️  Usuario admin ya existe');
      
      // Actualizar contraseña y rol
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('2406', salt);
      
      await adminExistente.update({
        password: passwordHash,
        rol: 'admin',
        emailVerificado: true
      });
      
      console.log('✅ Usuario admin actualizado');
      console.log('📧 Email: admin@bancoexclusivo.lat');
      console.log('🔑 Contraseña: 2406');
      console.log('👤 Rol: admin');
    } else {
      // Crear usuario admin
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('2406', salt);

      const admin = await User.create({
        nombre: 'Administrador',
        email: 'admin@bancoexclusivo.lat',
        password: passwordHash,
        cedula: '000-0000000-0',
        telefono: '000-000-0000',
        direccion: 'Oficina Central',
        saldo: 0,
        rol: 'admin',
        emailVerificado: true
      });

      console.log('✅ Usuario admin creado exitosamente');
      console.log('📧 Email: admin@bancoexclusivo.lat');
      console.log('🔑 Contraseña: 2406');
      console.log('👤 Rol: admin');
      console.log('🆔 ID:', admin.id);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

crearUsuarioAdmin();
