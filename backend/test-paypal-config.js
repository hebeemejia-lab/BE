#!/usr/bin/env node

require('dotenv').config({ path: '.env' });
const { sequelize } = require('./src/config/database');

async function testPayPalConfig() {
  console.log('\n🧪 TEST DE CONFIGURACIÓN PAYPAL\n');
  
  try {
    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log('✅ Base de datos conectada\n');

    // Revisar variables de entorno
    console.log('📋 Variables de entorno:');
    console.log(`  - PAYPAL_MODE: ${process.env.PAYPAL_MODE || 'NO CONFIGURADA'}`);
    console.log(`  - PAYPAL_BASE_URL: ${process.env.PAYPAL_BASE_URL || 'NO CONFIGURADA'}`);
    console.log(`  - PAYPAL_CLIENT_ID: ${process.env.PAYPAL_CLIENT_ID ? '✅ Configurada' : '❌ Falta'}`);
    console.log(`  - PAYPAL_CLIENT_SECRET: ${process.env.PAYPAL_CLIENT_SECRET ? '✅ Configurada' : '❌ Falta'}`);
    console.log(`  - FRONTEND_URL: ${process.env.FRONTEND_URL || '⚠️ NO CONFIGURADA (usando fallback)'}`);
    console.log(`  - TWOCHECKOUT_MERCHANT_CODE: ${process.env.TWOCHECKOUT_MERCHANT_CODE ? '✅ Configurada' : '⚠️ No configurada'}`);
    console.log('');

    // Determinar modo de PayPal
    const paypalService = require('./src/services/paypalService');
    console.log('📋 URLs que se usarán:');
    
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.bancoexclusivo.lat';
    console.log(`  - Frontend URL: ${frontendUrl}`);
    console.log(`  - Return URL: ${frontendUrl}/recargas?success=true`);
    console.log(`  - Cancel URL: ${frontendUrl}/recargas?error=cancelled`);
    console.log('');

    // Revisar rutas cargadas
    const recargaRoutes = require('./src/routes/recargaRoutes');
    console.log('📋 Endpoints de recargas configurados:');
    console.log('  ✅ POST /recargas/crear-paypal');
    console.log('  ✅ POST /recargas/paypal/capturar');
    console.log('  ✅ POST /recargas/crear-2checkout');
    console.log('  ✅ POST /recargas/crear-rapyd');
    console.log('');

    console.log('✅ TEST COMPLETADO\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

testPayPalConfig();
