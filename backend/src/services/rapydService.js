// backend/src/services/rapydService.js
const crypto = require('crypto');
const axios = require('axios');

const RAPYD_BASE_URL = process.env.RAPYD_BASE_URL || 'https://sandboxapi.rapyd.net';
const RAPYD_ACCESS_KEY = process.env.RAPYD_ACCESS_KEY;
const RAPYD_SECRET_KEY = process.env.RAPYD_SECRET_KEY;

// Generar firma HMAC para autenticación Rapyd
function generateRapydSignature(httpMethod, urlPath, salt, timestamp, body = '') {
  const bodyString = body ? JSON.stringify(body) : '';
  const toSign = httpMethod + urlPath + salt + timestamp + RAPYD_ACCESS_KEY + RAPYD_SECRET_KEY + bodyString;
  
  const hash = crypto.createHmac('sha256', RAPYD_SECRET_KEY);
  hash.update(toSign);
  const signature = Buffer.from(hash.digest('hex')).toString('base64');
  
  return signature;
}

// Hacer request autenticado a Rapyd
async function rapydRequest(method, path, body = null) {
  const salt = crypto.randomBytes(12).toString('hex');
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = generateRapydSignature(method, path, salt, timestamp, body);

  const headers = {
    'Content-Type': 'application/json',
    'access_key': RAPYD_ACCESS_KEY,
    'salt': salt,
    'timestamp': timestamp,
    'signature': signature,
  };

  try {
    const response = await axios({
      method,
      url: `${RAPYD_BASE_URL}${path}`,
      headers,
      data: body,
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error en Rapyd API:', error.response?.data || error.message);
    throw new Error(error.response?.data?.status?.message || 'Error en Rapyd API');
  }
}

// Obtener países soportados
async function getPaises() {
  try {
    const response = await rapydRequest('GET', '/v1/data/countries');
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Obtener tasas de cambio
async function getTasaCambio(monedaOrigen, monedaDestino, monto) {
  try {
    const response = await rapydRequest('GET', `/v1/rates/daily?buy_currency=${monedaDestino}&sell_currency=${monedaOrigen}&amount=${monto}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Obtener métodos de pago disponibles por país
async function getMetodosPago(pais) {
  try {
    const response = await rapydRequest('GET', `/v1/payment_methods/country?country=${pais}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Crear beneficiario (destinatario de transferencia)
async function crearBeneficiario(datos) {
  try {
    const body = {
      sender_country: datos.paisOrigen || 'US',
      sender_currency: datos.monedaOrigen || 'USD',
      beneficiary_country: datos.paisDestino,
      beneficiary_entity_type: 'individual',
      beneficiary_first_name: datos.nombre,
      beneficiary_last_name: datos.apellido,
      beneficiary_email: datos.email,
      beneficiary_phone_number: datos.telefono,
      payment_type: datos.metodoPago || 'bank', // bank, cash, wallet
      beneficiary_account_type: datos.tipoCuenta || 'checking',
      beneficiary_bank_account_number: datos.numeroCuenta,
      beneficiary_bank_code: datos.codigoBanco,
    };
    
    const response = await rapydRequest('POST', '/v1/payouts/beneficiary', body);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Crear payout (transferencia internacional)
async function crearPayout(datos) {
  try {
    const body = {
      beneficiary: datos.beneficiaryId,
      sender_amount: datos.monto,
      sender_currency: datos.monedaOrigen || 'USD',
      payout_method_type: datos.metodoPago,
      sender_country: datos.paisOrigen || 'US',
      description: datos.descripcion || 'Transferencia internacional',
      metadata: {
        usuarioId: datos.usuarioId,
        timestamp: new Date().toISOString(),
      },
    };
    
    const response = await rapydRequest('POST', '/v1/payouts', body);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Consultar estado de payout
async function consultarPayout(payoutId) {
  try {
    const response = await rapydRequest('GET', `/v1/payouts/${payoutId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Verificar cuenta bancaria
async function verificarCuentaBancaria(pais, numeroCuenta, codigoBanco) {
  try {
    const body = {
      country: pais,
      account_number: numeroCuenta,
      bank_code: codigoBanco,
    };
    
    const response = await rapydRequest('POST', '/v1/verify/bank_account', body);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Crear pago de recarga con Rapyd
async function crearPagoRecarga(datos) {
  try {
    const body = {
      amount: datos.monto * 100, // Rapyd usa centavos
      currency: 'USD',
      customer: {
        email: datos.email,
        first_name: datos.nombre,
        last_name: datos.apellido,
      },
      description: `Recarga de saldo - Usuario: ${datos.usuarioId}`,
      statement_descriptor: 'BANCO EXCLUSIVO',
      metadata: {
        usuarioId: datos.usuarioId,
        tipo: 'recarga',
        timestamp: new Date().toISOString(),
      },
    };
    
    const response = await rapydRequest('POST', '/v1/payments', body);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Consultar estado de pago
async function consultarPago(paymentId) {
  try {
    const response = await rapydRequest('GET', `/v1/payments/${paymentId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getPaises,
  getTasaCambio,
  getMetodosPago,
  crearBeneficiario,
  crearPayout,
  consultarPayout,
  verificarCuentaBancaria,
  crearPagoRecarga,
  consultarPago,
};
