// backend/src/services/rapydService.js
const crypto = require('crypto');
const axios = require('axios');

const RAPYD_BASE_URL = (process.env.RAPYD_BASE_URL || 'https://sandboxapi.rapyd.net').trim();
const RAPYD_ACCESS_KEY = (process.env.RAPYD_ACCESS_KEY || '').trim();
const RAPYD_SECRET_KEY = (process.env.RAPYD_SECRET_KEY || '').trim();

// Validar que las credenciales estén configuradas al cargar el módulo
if (!RAPYD_ACCESS_KEY || !RAPYD_SECRET_KEY) {
  console.warn('⚠️  ADVERTENCIA: Credenciales de Rapyd no configuradas completamente');
  console.warn(`   - RAPYD_ACCESS_KEY: ${RAPYD_ACCESS_KEY ? '✓ Configurada' : '✗ Falta'}`);
  console.warn(`   - RAPYD_SECRET_KEY: ${RAPYD_SECRET_KEY ? '✓ Configurada' : '✗ Falta'}`);
} else {
  console.log('✅ Rapyd Service: Credenciales cargadas correctamente');
  console.log(`   - Access Key: ${RAPYD_ACCESS_KEY.substring(0, 10)}...`);
  console.log(`   - Base URL: ${RAPYD_BASE_URL}`);
}

// Generar firma HMAC para autenticación Rapyd
function generateRapydSignature(httpMethod, urlPath, salt, timestamp, body = '') {
  // Trim credentials to remove any spaces
  const accessKey = RAPYD_ACCESS_KEY.trim();
  const secretKey = RAPYD_SECRET_KEY.trim();
  
  const bodyString = body ? JSON.stringify(body) : '';
  
  // Según documentación oficial de Rapyd:
  // signature = Base64(HMAC-SHA256(secret_key, http_method + url_path + salt + timestamp + access_key + secret_key + body))
  const toSign = httpMethod + urlPath + salt + timestamp + accessKey + secretKey + bodyString;
  
  console.log('🔐 Generando firma Rapyd:', {
    method: httpMethod,
    path: urlPath,
    saltLength: salt.length,
    timestamp,
    bodyLength: bodyString.length,
    stringToSignLength: toSign.length
  });
  
  // Crear HMAC con secret_key, luego firmar el string y convertir a base64
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(toSign)
    .digest('base64');
  
  return signature;
}

// Hacer request autenticado a Rapyd
async function rapydRequest(method, path, body = null) {
  // Validar credenciales
  if (!RAPYD_ACCESS_KEY || !RAPYD_SECRET_KEY) {
    const error = 'Credenciales de Rapyd no configuradas. Configure RAPYD_ACCESS_KEY y RAPYD_SECRET_KEY en .env';
    console.error('❌ ' + error);
    throw new Error(error);
  }

  // Validar que las credenciales no tengan espacios en blanco
  const cleanAccessKey = (RAPYD_ACCESS_KEY || '').trim();
  const cleanSecretKey = (RAPYD_SECRET_KEY || '').trim();
  
  if (!cleanAccessKey || !cleanSecretKey) {
    throw new Error('Credenciales de Rapyd están vacías o contienen solo espacios');
  }

  const salt = crypto.randomBytes(12).toString('hex');
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = generateRapydSignature(method, path, salt, timestamp, body);

  const headers = {
    'Content-Type': 'application/json',
    'access_key': cleanAccessKey,
    'salt': salt,
    'timestamp': timestamp,
    'signature': signature,
  };

  try {
    console.log('📡 Rapyd Request:', { 
      method, 
      path, 
      baseUrl: RAPYD_BASE_URL,
      hasAccessKey: !!cleanAccessKey,
      hasSecretKey: !!cleanSecretKey
    });
    const response = await axios({
      method,
      url: `${RAPYD_BASE_URL}${path}`,
      headers,
      data: body,
      timeout: 30000, // 30 segundos timeout
    });
    console.log('✅ Rapyd Response:', { status: response.status, statusMessage: response.data?.status?.status });
    return response.data;
  } catch (error) {
    console.error('❌ Error en Rapyd API:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.status?.message,
      errorCode: error.response?.data?.status?.error_code,
      data: error.response?.data
    });
    const errorMessage = error.response?.data?.status?.message || error.message || 'Error en Rapyd API';
    throw new Error(errorMessage);
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

// Crear pago de recarga con Rapyd (usando Checkout para URL de pago)
async function crearPagoRecarga(datos) {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    const body = {
      amount: Math.round(datos.monto), // Rapyd ya espera el monto en la unidad menor (centavos)
      currency: 'USD',
      customer_email: datos.email,
      description: `Recarga de saldo - Usuario: ${datos.usuarioId}`,
      metadata: {
        usuarioId: datos.usuarioId,
        tipo: 'recarga',
        nombre: datos.nombre,
        apellido: datos.apellido,
        timestamp: new Date().toISOString(),
      },
      // URLs de redirección
      complete_payment_url: `${frontendUrl}/recargas?success=true`,
      cancel_checkout_url: `${frontendUrl}/recargas?cancelled=true`,
      error_payment_url: `${frontendUrl}/recargas?error=true`,
      // Información del cliente
      customer: {
        email: datos.email,
        name: `${datos.nombre} ${datos.apellido}`,
      },
      // País del cliente (requerido en algunos casos)
      country: datos.pais || 'US',
    };
    
    console.log('📤 Enviando checkout a Rapyd:', { 
      amount: body.amount, 
      currency: body.currency,
      email: body.customer_email,
      country: body.country
    });
    
    const response = await rapydRequest('POST', '/v1/checkouts', body);
    
    console.log('✅ Checkout Rapyd creado:', {
      id: response.data?.id,
      redirect_url: response.data?.redirect_url,
      status: response.data?.status
    });
    
    // Rapyd devuelve redirect_url, no checkout_url
    return {
      id: response.data?.id,
      checkout_url: response.data?.redirect_url,
      status: response.data?.status,
    };
  } catch (error) {
    console.error('❌ Error creando checkout Rapyd:', error.message);
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
