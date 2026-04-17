// Script para importar usuarios desde usuarios_backup.sqlite a PostgreSQL (Render)
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Configura aquí tu DATABASE_URL de Render
const POSTGRES_URL = process.env.DATABASE_URL || 'postgres://usuario:password@host:puerto/db';

// Conexión a la base SQLite de respaldo
const backupSequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './usuarios_backup.sqlite',
  logging: false,
});

const BackupUser = backupSequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true },
  nombre: DataTypes.STRING,
  apellido: DataTypes.STRING,
  email: DataTypes.STRING,
  saldo: DataTypes.DECIMAL(15, 2),
  rol: DataTypes.STRING,
}, {
  timestamps: false,
});

// Conexión a la base PostgreSQL de Render
const pgSequelize = new Sequelize(POSTGRES_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  },
  logging: false,
});

const PgUser = pgSequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true },
  nombre: DataTypes.STRING,
  apellido: DataTypes.STRING,
  email: DataTypes.STRING,
  saldo: DataTypes.DECIMAL(15, 2),
  rol: DataTypes.STRING,
}, {
  timestamps: false,
  tableName: 'Users', // Asegúrate que coincida con tu tabla en PG
});

async function importUsers() {
  try {
    await backupSequelize.authenticate();
    await pgSequelize.authenticate();
    const usuarios = await BackupUser.findAll({ raw: true });
    console.log(`Usuarios a importar: ${usuarios.length}`);
    for (const user of usuarios) {
      // Inserta o actualiza por email
      await PgUser.upsert(user);
    }
    console.log('✅ Usuarios importados a PostgreSQL');
  } catch (err) {
    console.error('❌ Error importando usuarios:', err.message);
  } finally {
    await backupSequelize.close();
    await pgSequelize.close();
  }
}

importUsers();
