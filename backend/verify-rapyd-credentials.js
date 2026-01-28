#!/usr/bin/env node
// Verificar que las credenciales de Rapyd están correctas

require('dotenv').config();

const RAPYD_ACCESS_KEY = (process.env.RAPYD_ACCESS_KEY || '').trim();
const RAPYD_SECRET_KEY = (process.env.RAPYD_SECRET_KEY || '').trim();
const RAPYD_BASE_URL = (process.env.RAPYD_BASE_URL || '').trim();

console.log('🔐 VALIDACIÓN DE CREDENCIALES RAPYD');
console.log('=====================================');

if (!RAPYD_ACCESS_KEY) {
  console.log('❌ RAPYD_ACCESS_KEY: NO CONFIGURADA');
} else {
  console.log(`✅ RAPYD_ACCESS_KEY: ${RAPYD_ACCESS_KEY.substring(0, 10)}...${RAPYD_ACCESS_KEY.substring(RAPYD_ACCESS_KEY.length - 5)} (${RAPYD_ACCESS_KEY.length} chars)`);
}

if (!RAPYD_SECRET_KEY) {
  console.log('❌ RAPYD_SECRET_KEY: NO CONFIGURADA');
} else {
  console.log(`✅ RAPYD_SECRET_KEY: ${RAPYD_SECRET_KEY.substring(0, 10)}...${RAPYD_SECRET_KEY.substring(RAPYD_SECRET_KEY.length - 5)} (${RAPYD_SECRET_KEY.length} chars)`);
}

if (!RAPYD_BASE_URL) {
  console.log('❌ RAPYD_BASE_URL: NO CONFIGURADA');
} else {
  console.log(`✅ RAPYD_BASE_URL: ${RAPYD_BASE_URL}`);
}

// Validar formato
if (RAPYD_ACCESS_KEY && !RAPYD_ACCESS_KEY.startsWith('rak_')) {
  console.log('⚠️  RAPYD_ACCESS_KEY no empieza con "rak_"');
}

if (RAPYD_SECRET_KEY && !RAPYD_SECRET_KEY.startsWith('rsk_')) {
  console.log('⚠️  RAPYD_SECRET_KEY no empieza con "rsk_"');
}

if (RAPYD_ACCESS_KEY && RAPYD_SECRET_KEY && RAPYD_BASE_URL) {
  console.log('\n✅ Todas las credenciales están configuradas correctamente');
} else {
  console.log('\n❌ Faltan credenciales. Por favor configura todas antes de ejecutar.');
  process.exit(1);
}
