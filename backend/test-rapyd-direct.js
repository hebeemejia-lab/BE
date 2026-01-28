#!/usr/bin/env node
// Test directo de Rapyd con debugging completo

require('dotenv').config();
const crypto = require('crypto');
const axios = require('axios');

const RAPYD_BASE_URL = 'https://sandboxapi.rapyd.net';
const RAPYD_ACCESS_KEY = (process.env.RAPYD_ACCESS_KEY || '').trim();
const RAPYD_SECRET_KEY = (process.env.RAPYD_SECRET_KEY || '').trim();

console.log('🔍 TEST DE RAPYD');
console.log('================\n');

console.log('Credenciales cargadas:');
console.log(`  Access Key: ${RAPYD_ACCESS_KEY.substring(0, 15)}... (length: ${RAPYD_ACCESS_KEY.length})`);
console.log(`  Secret Key: ${RAPYD_SECRET_KEY.substring(0, 15)}... (length: ${RAPYD_SECRET_KEY.length})`);
console.log(`  Base URL: ${RAPYD_BASE_URL}\n`);

// Generar firma HMAC
function generateSignature(httpMethod, urlPath, salt, timestamp, body = '') {
  const bodyString = body ? JSON.stringify(body) : '';
  const toSign = httpMethod + urlPath + salt + timestamp + bodyString;
  
  console.log('String a firmar (sin credenciales):');
  console.log(`  ${toSign.substring(0, 100)}...\n`);
  
  const signature = crypto
    .createHmac('sha256', RAPYD_SECRET_KEY)
    .update(toSign)
    .digest('base64');
  
  return signature;
}

// Test de checkout
async function testCheckout() {
  const salt = crypto.randomBytes(12).toString('hex');
  const timestamp = Math.floor(Date.now() / 1000).toString();
  
  const body = {
    amount: 100, // $1 USD en centavos
    currency: 'USD',
    customer_email: 'test@test.com',
    description: 'Test de recarga',
    metadata: {
      test: 'true',
      timestamp: new Date().toISOString(),
    },
    complete_payment_url: 'https://www.bancoexclusivo.lat/recargas?success=true',
    cancel_checkout_url: 'https://www.bancoexclusivo.lat/recargas?cancelled=true',
    error_payment_url: 'https://www.bancoexclusivo.lat/recargas?error=true',
    customer: {
      email: 'test@test.com',
      name: 'Test User',
    },
    country: 'US',
  };
  
  const signature = generateSignature('POST', '/v1/checkouts', salt, timestamp, body);
  
  const headers = {
    'Content-Type': 'application/json',
    'access_key': RAPYD_ACCESS_KEY,
    'salt': salt,
    'timestamp': timestamp,
    'signature': signature,
  };
  
  console.log('Headers enviados:');
  console.log(`  access_key: ${RAPYD_ACCESS_KEY.substring(0, 15)}...`);
  console.log(`  salt: ${salt}`);
  console.log(`  timestamp: ${timestamp}`);
  console.log(`  signature: ${signature.substring(0, 30)}...\n`);
  
  console.log('Body enviado:');
  console.log(JSON.stringify(body, null, 2) + '\n');
  
  try {
    console.log('Enviando POST a /v1/checkouts...\n');
    const response = await axios({
      method: 'POST',
      url: `${RAPYD_BASE_URL}/v1/checkouts`,
      headers,
      data: body,
      timeout: 30000,
    });
    
    console.log('✅ ÉXITO! Respuesta:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ ERROR! Respuesta:');
    console.log(`  Status: ${error.response?.status}`);
    console.log(`  Error Code: ${error.response?.data?.status?.error_code}`);
    console.log(`  Message: ${error.response?.data?.status?.message || 'N/A'}`);
    console.log(`  Full Response:`);
    console.log(JSON.stringify(error.response?.data, null, 2));
  }
}

testCheckout();
