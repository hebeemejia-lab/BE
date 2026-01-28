// Script para verificar endpoints disponibles
const axios = require('axios');

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:5000';

async function verificarEndpoints() {
  console.log('🔍 Verificando endpoints del backend...\n');
  console.log(`📡 URL Base: ${BASE_URL}\n`);

  const tests = [
    {
      nombre: 'Health Check',
      url: `${BASE_URL}/health`,
      method: 'GET',
    },
    {
      nombre: 'Rutas Debug',
      url: `${BASE_URL}/debug/routes`,
      method: 'GET',
    },
    {
      nombre: 'Recargas Test',
      url: `${BASE_URL}/recargas/test`,
      method: 'GET',
    },
    {
      nombre: 'Recargas Debug',
      url: `${BASE_URL}/recargas/debug`,
      method: 'GET',
    },
  ];

  for (const test of tests) {
    try {
      console.log(`\n📋 Test: ${test.nombre}`);
      console.log(`   ${test.method} ${test.url}`);
      
      const response = await axios({
        method: test.method,
        url: test.url,
        timeout: 5000,
      });
      
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📦 Response:`, JSON.stringify(response.data, null, 2).substring(0, 200));
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data:`, error.response.data);
      }
    }
  }

  console.log('\n\n╔════════════════════════════════════════════════╗');
  console.log('║  INSTRUCCIONES PARA PROBAR CREAR-RAPYD        ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  console.log('1. Primero necesitas obtener un token de autenticación:');
  console.log(`   POST ${BASE_URL}/auth/login`);
  console.log('   Body: { "email": "tu@email.com", "password": "tupassword" }\n');
  console.log('2. Con el token, prueba crear-rapyd:');
  console.log(`   POST ${BASE_URL}/recargas/crear-rapyd`);
  console.log('   Headers: { "Authorization": "Bearer TU_TOKEN" }');
  console.log('   Body: { "monto": 10 }\n');
  console.log('3. El servidor debería devolver una checkoutUrl\n');
}

verificarEndpoints().catch(console.error);
