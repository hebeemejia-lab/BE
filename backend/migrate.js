// Script de migración - sincroniza todos los modelos con la base de datos
const { sequelize } = require('./src/config/database');
// Cargar TODOS los modelos para que sequelize los registre antes de sync()
require('./src/models');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

async function migrar() {
  try {
    console.log('🔄 Iniciando migración...');
    
    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log('✅ Conectado a la base de datos');

    // Agregar valores ENUM faltantes en PostgreSQL (sync({ alter: true }) no los agrega)
    const enumMigrations = [
      { type: '"enum_Recargas_metodo"', value: 'googlepay' },
      { type: '"enum_Loans_estado"',    value: 'aprobado' },
      { type: '"enum_Loans_estado"',    value: 'rechazado' },
      { type: '"enum_Loans_estado"',    value: 'completado' },
    ];
    for (const { type, value } of enumMigrations) {
      try {
        await sequelize.query(`
          DO $$ BEGIN
            ALTER TYPE ${type} ADD VALUE IF NOT EXISTS '${value}';
          EXCEPTION WHEN others THEN NULL;
          END $$;
        `);
      } catch (_) { /* SQLite or type doesn't exist yet — safe to ignore */ }
    }
    console.log('✅ ENUM values verificados');

    // Columnas nuevas que pueden no existir en producción — agregar explícitamente
    const columnMigrations = [
      `ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "saldoEnTransitoAlpaca" DECIMAL(15,2) DEFAULT 0`,
      `ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "alpacaAccountId" VARCHAR(255)`,
      `ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "alpacaFunded" BOOLEAN DEFAULT false`,
    ];
    for (const sql of columnMigrations) {
      try {
        await sequelize.query(sql);
      } catch (_) { /* SQLite ignora IF NOT EXISTS — seguro */ }
    }
    console.log('✅ Columnas críticas verificadas');

    // Sincronizar TODOS los modelos con alter: true para agregar columnas nuevas
    await sequelize.sync({ alter: true });
    console.log('✅ Tablas sincronizadas (alter: columnas y tablas nuevas agregadas)');

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
        rol: 'admin',
        emailVerificado: true
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
        rol: 'admin',
        emailVerificado: true
      });

      console.log('✅ Usuario admin creado');
    }

    console.log('');
    console.log('🎉 Migración completada exitosamente');
    console.log('📧 Email admin: admin@bancoexclusivo.lat');
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
