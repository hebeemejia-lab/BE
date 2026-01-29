// Script de migración para agregar columna rol y crear usuario admin
const { sequelize } = require('./src/config/database');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

async function migrar() {
  try {
    console.log('🔄 Iniciando migración...');
    
    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log('✅ Conectado a la base de datos');

    // Sincronizar modelos (ALTER TABLE para agregar columna rol)
    await sequelize.sync({ alter: true });
    console.log('✅ Tablas sincronizadas (columna rol agregada si no existía)');

    // Verificar si existe el usuario admin
    let admin = await User.findOne({ 
      where: { email: 'admin@bancoexclusivo.lat' } 
    });

    if (admin) {
      console.log('📝 Actualizando usuario admin...');
      
      // Actualizar contraseña y rol
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('2406', salt);
      
      await admin.update({
        password: passwordHash,
        rol: 'admin'
      });
      
      console.log('✅ Usuario admin actualizado');
    } else {
      console.log('📝 Creando usuario admin...');
      
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('2406', salt);

      admin = await User.create({
        nombre: 'Administrador',
        email: 'admin@bancoexclusivo.lat',
        password: passwordHash,
        cedula: '000-0000000-0',
        telefono: '000-000-0000',
        direccion: 'Oficina Central',
        saldo: 0,
        rol: 'admin'
      });

      console.log('✅ Usuario admin creado');
    }

    console.log('');
    console.log('🎉 Migración completada exitosamente');
    console.log('📧 Email admin: admin@bancoexclusivo.lat');
    console.log('🔑 Contraseña: 2406');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('⚠️  Advertencia en migración:', error.message);
    console.log('ℹ️  La migración puede ejecutarse después si es necesario');
    // NO salir con error - permitir que el servidor inicie de todas formas
    process.exit(0);
  }
}

migrar();
