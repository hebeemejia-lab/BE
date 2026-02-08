const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const { sequelize } = require('./src/config/database');

async function crearSubAdmin() {
  try {
    const email = process.env.SUBADMIN_EMAIL;
    const passwordPlano = process.env.SUBADMIN_PASSWORD;

    if (!email || !passwordPlano) {
      console.error('❌ Faltan SUBADMIN_EMAIL o SUBADMIN_PASSWORD en el entorno');
      process.exit(1);
    }

    await sequelize.authenticate();
    console.log('✅ Conexion a base de datos exitosa');

    await sequelize.sync();
    console.log('✅ Modelos sincronizados (sin alter)');

    const emailNormalizado = email.toLowerCase().trim();
    const existente = await User.findOne({ where: { email: emailNormalizado } });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordPlano, salt);

    if (existente) {
      await existente.update({
        password: passwordHash,
        rol: 'admin_lite',
        emailVerificado: true,
      });

      console.log('✅ Subadmin actualizado');
      console.log('📧 Email:', emailNormalizado);
      console.log('👤 Rol: admin_lite');
      process.exit(0);
    }

    const subadmin = await User.create({
      nombre: 'Sub Admin',
      apellido: 'Banco Exclusivo',
      email: emailNormalizado,
      password: passwordHash,
      cedula: '000-0000000-1',
      telefono: '000-000-0001',
      direccion: 'Oficina Central',
      saldo: 0,
      rol: 'admin_lite',
      emailVerificado: true,
    });

    console.log('✅ Subadmin creado exitosamente');
    console.log('📧 Email:', emailNormalizado);
    console.log('👤 Rol: admin_lite');
    console.log('🆔 ID:', subadmin.id);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

crearSubAdmin();
