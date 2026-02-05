const axios = require('axios');

const getBaseUrl = () => {
  const mode = (process.env.PAYPAL_MODE || '').toLowerCase();
  if (process.env.PAYPAL_BASE_URL) {
    return process.env.PAYPAL_BASE_URL;
  }
  return mode === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';
};

const getAccessToken = async () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('PayPal: faltan PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET');
  }

  const baseUrl = getBaseUrl();
  try {
    const response = await axios.post(
      `${baseUrl}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        auth: {
          username: clientId,
          password: clientSecret,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data.access_token;
  } catch (error) {
    const details = error.response?.data || error.message;
    throw new Error(`PayPal token error: ${JSON.stringify(details)}`);
  }
};

const crearOrden = async ({ monto, currency = 'USD', returnUrl, cancelUrl, referencia }) => {
  const accessToken = await getAccessToken();
  const baseUrl = getBaseUrl();

  // Debug: Ver qué monto llega
  console.log('🔍 PayPal Service - Monto recibido:', monto, 'Tipo:', typeof monto);
  
  // Validar que el monto existe y es válido
  if (monto === undefined || monto === null || monto === '') {
    throw new Error('PayPal: Monto no proporcionado o es null/undefined');
  }
  
  const montoNumerico = parseFloat(Number(monto).toFixed(2));
  console.log('🔍 PayPal Service - Monto procesado:', montoNumerico, 'Tipo:', typeof montoNumerico);
  
  // Validar que el monto es un número válido
  if (isNaN(montoNumerico) || !isFinite(montoNumerico)) {
    throw new Error(`PayPal: Monto inválido después de conversión: ${monto} -> ${montoNumerico}`);
  }
  
  // Validar monto mínimo
  if (montoNumerico <= 0) {
    throw new Error(`PayPal: El monto debe ser mayor a 0. Monto recibido: ${montoNumerico}`);
  }
  
  // Validar monto mínimo para PayPal (0.01 USD)
  if (montoNumerico < 0.01) {
    throw new Error(`PayPal: El monto mínimo es $0.01 USD. Monto recibido: ${montoNumerico}`);
  }
  
  // Convertir a string con formato correcto (2 decimales)
  const montoString = montoNumerico.toFixed(2);
  console.log('🔍 PayPal Service - Monto como string:', montoString);

  const payload = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: currency,
          value: montoString, // PayPal requiere string, no número
        },
        description: 'Recarga de saldo Banco Exclusivo',
        custom_id: referencia,
      },
    ],
    application_context: {
      return_url: returnUrl,
      cancel_url: cancelUrl,
      user_action: 'CONTINUE',
      landing_page: 'LOGIN',  // LOGIN requiere autenticación en PayPal
    },
  };

  console.log('📤 Enviando payload a PayPal:', JSON.stringify(payload, null, 2));

  try {
    const response = await axios.post(`${baseUrl}/v2/checkout/orders`, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    const details = error.response?.data || error.message;
    throw new Error(`PayPal create order error: ${JSON.stringify(details)}`);
  }
};

const capturarOrden = async (orderId) => {
  const accessToken = await getAccessToken();
  const baseUrl = getBaseUrl();

  try {
    console.log('🔄 PayPal Service: Capturando orden', orderId);
    const response = await axios.post(
      `${baseUrl}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ PayPal Service: Captura exitosa');
    return response.data;
  } catch (error) {
    console.error('❌ PayPal Service: Error en captura');
    console.error('   Status:', error.response?.status);
    console.error('   Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('   Message:', error.message);
    
    const details = error.response?.data || error.message;
    const err = new Error(`PayPal capture error: ${JSON.stringify(details)}`);
    err.response = error.response; // Preservar respuesta original
    throw err;
  }
};

module.exports = {
  crearOrden,
  capturarOrden,
};
