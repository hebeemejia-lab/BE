#!/usr/bin/env node

require('dotenv').config({ path: '.env' });
const { sequelize } = require('./src/config/database');
const User = require('./src/models/User');
const BankAccount = require('./src/models/BankAccount');
require('./src/models'); // Cargar relaciones

async function testBankAccountFlow() {
  console.log('\n🧪 TEST COMPLETO DE CUENTAS BANCARIAS\n');
  
  try {
    // Conectar y sincronizar
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('✅ Base de datos conectada y sincronizada\n');

    // 1. Crear usuario de test
    console.log('📋 Paso 1: Crear usuario de test');
    const usuario = await User.create({
      nombre: 'Test User',
      apellido: 'Test',
      email: `test-${Date.now()}@test.com`,
      password: 'TestPass123',
      cedula: `TEST${Date.now()}`,
      telefono: '8091234567',
      direccion: 'Test Address',
      emailVerificado: true,
    });
    console.log(`✅ Usuario creado: ${usuario.id}\n`);

    // 2. Crear cuenta bancaria
    console.log('📋 Paso 2: Crear cuenta bancaria');
    const cuenta = await BankAccount.create({
      usuarioId: usuario.id,
      bankAccountToken: null,
      nombreCuenta: 'Test Account',
      numerosCuenta: '1234',
      banco: 'Banreservas',
      tipoCuenta: 'ahorros',
      estado: 'pendiente',
    });
    console.log(`✅ Cuenta creada: ${cuenta.id}\n`);

    // 3. Verificar que la cuenta existe
    console.log('📋 Paso 3: Verificar cuenta');
    const cuentaVerificada = await BankAccount.findByPk(cuenta.id);
    console.log(`✅ Cuenta encontrada en BD: ${cuentaVerificada ? 'SÍ' : 'NO'}`);
    console.log(`   - ID: ${cuentaVerificada?.id}`);
    console.log(`   - Usuario: ${cuentaVerificada?.usuarioId}`);
    console.log(`   - Banco: ${cuentaVerificada?.banco}`);
    console.log('');

    // 4. Obtener cuentas del usuario
    console.log('📋 Paso 4: Obtener cuentas del usuario');
    const cuentasDelUsuario = await BankAccount.findAll({
      where: { usuarioId: usuario.id }
    });
    console.log(`✅ Cuentas del usuario: ${cuentasDelUsuario.length}`);
    cuentasDelUsuario.forEach(c => {
      console.log(`   - ID: ${c.id}, Banco: ${c.banco}, Estado: ${c.estado}`);
    });
    console.log('');

    // 5. Crear segunda cuenta
    console.log('📋 Paso 5: Crear segunda cuenta');
    const cuenta2 = await BankAccount.create({
      usuarioId: usuario.id,
      bankAccountToken: null,
      nombreCuenta: 'Test Account 2',
      numerosCuenta: '5678',
      banco: 'Banco Popular',
      tipoCuenta: 'corriente',
      estado: 'pendiente',
    });
    console.log(`✅ Segunda cuenta creada: ${cuenta2.id}\n`);

    // 6. Verificar ambas cuentas
    console.log('📋 Paso 6: Verificar ambas cuentas');
    const cuentasFinales = await BankAccount.findAll({
      where: { usuarioId: usuario.id }
    });
    console.log(`✅ Total de cuentas: ${cuentasFinales.length}`);
    cuentasFinales.forEach(c => {
      console.log(`   - ID: ${c.id}, Banco: ${c.banco}, Estado: ${c.estado}`);
    });
    console.log('');

    // 7. Revisar relaciones
    console.log('📋 Paso 7: Verificar relaciones');
    console.log('Relaciones User:', Object.keys(User.associations));
    console.log('Relaciones BankAccount:', Object.keys(BankAccount.associations));
    console.log('');

    console.log('✅ TEST COMPLETADO SIN ERRORES\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

testBankAccountFlow();
