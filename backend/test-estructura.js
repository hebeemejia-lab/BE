#!/usr/bin/env node

/**
 * Testing Script Simple - Banco Exclusivo
 * Verifica la estructura del proyecto
 */

const fs = require('fs');
const path = require('path');

console.log(`\n╔════════════════════════════════════╗`);
console.log(`║   TESTING - Banco Exclusivo        ║`);
console.log(`║   Verificación de estructura       ║`);
console.log(`╚════════════════════════════════════╝\n`);

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  const icon = exists ? '✅' : '❌';
  console.log(`${icon} ${description}`);
  return exists;
}

function checkDir(dirPath, description) {
  const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  const icon = exists ? '✅' : '❌';
  console.log(`${icon} ${description}`);
  return exists;
}

let passed = 0;
let total = 0;

// Backend estructura
console.log('\n📦 BACKEND ESTRUCTURA:');
total++; checkDir('./src', 'Carpeta /src') && passed++;
total++; checkDir('./src/services', 'Carpeta /src/services') && passed++;
total++; checkDir('./src/models', 'Carpeta /src/models') && passed++;
total++; checkDir('./src/controllers', 'Carpeta /src/controllers') && passed++;
total++; checkDir('./src/routes', 'Carpeta /src/routes') && passed++;

// Servicios nuevos
console.log('\n🔌 SERVICIOS NUEVOS:');
total++; checkFile('./src/services/paypalPayoutsService.js', 'PayPal Payouts Service') && passed++;
total++; checkFile('./src/services/paypalService.js', 'PayPal Service (modificado)') && passed++;

// Modelos nuevos
console.log('\n📊 MODELOS NUEVOS:');
total++; checkFile('./src/models/SolicitudRetiroManual.js', 'Modelo SolicitudRetiroManual') && passed++;
total++; checkFile('./src/models/index.js', 'Modelo index (actualizado)') && passed++;

// Controladores modificados
console.log('\n🎮 CONTROLADORES MODIFICADOS:');
total++; checkFile('./src/controllers/retiroController.js', 'Retiro Controller (actualizado)') && passed++;

// Rutas nuevas
console.log('\n🛣️  RUTAS NUEVAS:');
total++; checkFile('./src/routes/adminRetiroRoutes.js', 'Admin Retiro Routes (nueva)') && passed++;
total++; checkFile('./src/index.js', 'Index Principal (actualizado)') && passed++;

// Documentación
console.log('\n📚 DOCUMENTACIÓN:');
total++; checkFile('../PAYPAL_PAYOUTS_IMPLEMENTACION.md', 'Guía PayPal Payouts') && passed++;
total++; checkFile('../ACTUALIZACION_PAYPAL_PAYOUTS.md', 'Actualización') && passed++;
total++; checkFile('../FLUJOS_DIAGRAMA.md', 'Diagramas de Flujo') && passed++;
total++; checkFile('../RESUMEN_IMPLEMENTACION.md', 'Resumen') && passed++;

// Frontend
console.log('\n🖥️  FRONTEND:');
total++; checkFile('../frontend/src/pages/RecargasNew.js', 'Página de Recargas (actualizada)') && passed++;
total++; checkFile('../frontend/src/services/retiroService.js', 'Retiro Service (nueva)') && passed++;

// Verificaciones de código
console.log('\n🔍 VERIFICACIONES DE CÓDIGO:');

// Verificar paypalService cambios
let paypalServiceContent = fs.readFileSync('./src/services/paypalService.js', 'utf8');
let hasGuestCheckout = paypalServiceContent.includes('GUEST_CHECKOUT');
let hasContinue = paypalServiceContent.includes("'CONTINUE'");
total++; hasGuestCheckout && hasContinue ? (console.log('✅ PayPal Service tiene GUEST_CHECKOUT'), passed++) : console.log('❌ PayPal Service no tiene GUEST_CHECKOUT');

// Verificar retiroController
let retiroControllerContent = fs.readFileSync('./src/controllers/retiroController.js', 'utf8');
let hasPaypalPayouts = retiroControllerContent.includes('paypalPayoutsService');
let hasObtenerSolicitudes = retiroControllerContent.includes('obtenerSolicitudesRetiroManuales');
total++; hasPaypalPayouts ? (console.log('✅ RetiroController importa PayPal Payouts'), passed++) : console.log('❌ RetiroController no tiene PayPal Payouts');
total++; hasObtenerSolicitudes ? (console.log('✅ RetiroController tiene funciones de admin'), passed++) : console.log('❌ RetiroController sin funciones de admin');

// Verificar RecargasNew
let recargasNewContent = fs.readFileSync('../frontend/src/pages/RecargasNew.js', 'utf8');
let hasGuestPaymentText = recargasNewContent.includes('Paga como invitado') || recargasNewContent.includes('Proceder al Pago');
total++; hasGuestPaymentText ? (console.log('✅ RecargasNew tiene texto de pago'), passed++) : console.log('❌ RecargasNew no tiene texto correcto');

// Variables de entorno
console.log('\n🔐 VARIABLES DE ENTORNO:');
const envFile = fs.readFileSync('./.env', 'utf8');
let hasPaypalMode = envFile.includes('PAYPAL_MODE=live');
let hasPaypalUrl = envFile.includes('PAYPAL_BASE_URL=https://api-m.paypal.com');
total++; hasPaypalMode ? (console.log('✅ PAYPAL_MODE=live'), passed++) : console.log('❌ PAYPAL_MODE no es live');
total++; hasPaypalUrl ? (console.log('✅ PAYPAL_BASE_URL=https://api-m.paypal.com'), passed++) : console.log('❌ PAYPAL_BASE_URL no correcta');

// Resumen
console.log(`\n╔════════════════════════════════════╗`);
console.log(`║   RESULTADO FINAL                  ║`);
console.log(`╚════════════════════════════════════╝\n`);

const percentage = ((passed / total) * 100).toFixed(0);
console.log(`✅ Tests pasados: ${passed}/${total} (${percentage}%)\n`);

if (passed === total) {
  console.log('🎉 ¡TODOS LOS TESTS PASARON! El sistema está listo para testing.\n');
  process.exit(0);
} else {
  console.log(`⚠️  ${total - passed} test(s) fallaron. Revisa los archivos marcados con ❌\n`);
  process.exit(1);
}
