#!/usr/bin/env node

require('dotenv').config({ path: '.env' });
const { sequelize } = require('./src/config/database');
const User = require('./src/models/User');
const BankAccount = require('./src/models/BankAccount');

async function testBankAccounts() {
  console.log('\n🧪 TEST DE CUENTAS BANCARIAS\n');
  
  try {
    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log('✅ Conectado a la base de datos\n');

    // Revisar relaciones
    console.log('📋 Relaciones definidas:');
    console.log('User.associations:', Object.keys(User.associations || {}));
    console.log('BankAccount.associations:', Object.keys(BankAccount.associations || {}));
    console.log('');

    // Revisar si hay un foreign key constraint
    const bankAccountSchema = BankAccount.getAttributes();
    console.log('📋 Atributos de BankAccount:');
    console.log('  - usuarioId:', bankAccountSchema.usuarioId);
    console.log('  - bankAccountToken:', bankAccountSchema.bankAccountToken);
    console.log('');

    // Listar todas las cuentas existentes
    const cuentas = await BankAccount.findAll({
      include: [{
        model: User,
        attributes: ['id', 'nombre', 'email']
      }]
    });

    console.log(`📊 Total de cuentas bancarias: ${cuentas.length}`);
    if (cuentas.length > 0) {
      console.log('  Detalles:');
      cuentas.forEach(cuenta => {
        console.log(`  - ID: ${cuenta.id}, Usuario: ${cuenta.User?.nombre || 'N/A'}, Banco: ${cuenta.banco}, Estado: ${cuenta.estado}`);
      });
    }
    console.log('');

    // Revisar si hay usuarios sin cuentas
    const usuarios = await User.findAll({
      attributes: ['id', 'nombre', 'email']
    });
    console.log(`📊 Total de usuarios: ${usuarios.length}`);
    
    const usuariosConCuentas = new Set(cuentas.map(c => c.usuarioId));
    const usuariosSinCuentas = usuarios.filter(u => !usuariosConCuentas.has(u.id));
    console.log(`   - Con cuentas: ${usuariosConCuentas.size}`);
    console.log(`   - Sin cuentas: ${usuariosSinCuentas.length}`);
    console.log('');

    console.log('✅ TEST COMPLETADO\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

testBankAccounts();
