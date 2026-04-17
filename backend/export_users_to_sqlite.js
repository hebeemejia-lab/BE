// Script para exportar usuarios y saldos a SQLite
const { Sequelize, DataTypes } = require('sequelize');
const { User } = require('./src/models');
const fs = require('fs');

// Configuración de la base SQLite de respaldo
const backupDbPath = './usuarios_backup.sqlite';
const backupSequelize = new Sequelize({
  dialect: 'sqlite',
  storage: backupDbPath,
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

async function exportUsers() {
  try {
    // Obtener todos los usuarios de la base principal
    const usuarios = await User.findAll({
      attributes: ['id', 'nombre', 'apellido', 'email', 'saldo', 'rol'],
      raw: true,
    });
    console.log(`Usuarios encontrados: ${usuarios.length}`);

    // Preparar la base SQLite de respaldo
    await backupSequelize.sync({ force: true });
    await BackupUser.bulkCreate(usuarios);
    console.log('✅ Usuarios exportados a', backupDbPath);
  } catch (err) {
    console.error('❌ Error exportando usuarios:', err.message);
  } finally {
    await backupSequelize.close();
  }
}

exportUsers();
