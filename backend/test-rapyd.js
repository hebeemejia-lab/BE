// Script de prueba rápida para Rapyd
require('dotenv').config();
const rapydService = require('./src/services/rapydService');

async function testRapydConfiguration() {
  console.log('🧪 Iniciando pruebas de Rapyd...\n');

  // 1. Verificar variables de entorno
  console.log('1️⃣ Verificando variables de entorno...');
  const accessKey = process.env.RAPYD_ACCESS_KEY;
  const secretKey = process.env.RAPYD_SECRET_KEY;
  const baseUrl = process.env.RAPYD_BASE_URL;

  if (!accessKey || !secretKey) {
    console.error('❌ ERROR: Faltan credenciales de Rapyd');
    console.log('   RAPYD_ACCESS_KEY:', accessKey ? '✅ Configurado' : '❌ Falta');
    console.log('   RAPYD_SECRET_KEY:', secretKey ? '✅ Configurado' : '❌ Falta');
    console.log('\n   Agrega estas variables en tu archivo .env:');
    console.log('   RAPYD_ACCESS_KEY=tu_access_key_aqui');
    console.log('   RAPYD_SECRET_KEY=tu_secret_key_aqui');
    console.log('   RAPYD_BASE_URL=https://sandboxapi.rapyd.net\n');
    return;
  }

  console.log('✅ Credenciales configuradas');
  console.log('   Access Key:', accessKey.substring(0, 10) + '...');
  console.log('   Base URL:', baseUrl || 'https://sandboxapi.rapyd.net');
  console.log('');

  // 2. Probar obtener países
  console.log('2️⃣ Probando conexión (obtener países)...');
  try {
    const paises = await rapydService.getPaises();
    console.log('✅ Conexión exitosa');
    console.log(`   Países disponibles: ${paises.length}`);
    console.log('');
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.log('\n   Posibles causas:');
    console.log('   1. Credenciales incorrectas');
    console.log('   2. Base URL incorrecta');
    console.log('   3. Sin conexión a internet');
    console.log('   4. Cuenta de Rapyd suspendida\n');
    return;
  }

  // 3. Probar crear checkout (sin guardar en BD)
  console.log('3️⃣ Probando crear checkout de prueba...');
  try {
    const checkout = await rapydService.crearPagoRecarga({
      monto: 1, // $1 USD
      email: 'test@example.com',
      nombre: 'Test',
      apellido: 'User',
      usuarioId: 999,
      pais: 'US',
    });

    console.log('✅ Checkout creado exitosamente');
    console.log('   ID:', checkout.id);
    console.log('   URL:', checkout.checkout_url);
    console.log('   Estado:', checkout.status);
    console.log('\n   🎉 ¡Tu integración de Rapyd está funcionando correctamente!\n');
  } catch (error) {
    console.error('❌ Error creando checkout:', error.message);
    console.log('\n   Posibles causas:');
    console.log('   1. Parámetros inválidos');
    console.log('   2. Cuenta no tiene permisos para crear checkouts');
    console.log('   3. Moneda no soportada');
    console.log('   4. Límite de API alcanzado\n');
  }
}

// Ejecutar pruebas
testRapydConfiguration()
  .then(() => {
    console.log('✅ Pruebas completadas\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error ejecutando pruebas:', error.message);
    process.exit(1);
  });
