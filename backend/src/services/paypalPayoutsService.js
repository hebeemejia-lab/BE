const axios = require('axios');

// PayPal Payouts Service - Transferencias REALES de dinero a cuentas bancarias
// Usa las mismas credenciales LIVE de PayPal que ya tienes configuradas

const getBaseUrl = () => {
  const mode = (process.env.PAYPAL_MODE || '').toLowerCase();
  if (process.env.PAYPAL_BASE_URL) {
    return process.env.PAYPAL_BASE_URL;
  }
  return mode === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';
};

// Obtener token de acceso de PayPal
const getAccessToken = async () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('PayPal: faltan PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET para Payouts');
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
    throw new Error(`PayPal Payouts token error: ${JSON.stringify(details)}`);
  }
};

// Crear un Payout (transferencia de dinero)
const crearPayout = async ({
  monto,
  currency = 'USD',
  numeroCuenta,
  nombreBeneficiario,
  banco,
  referencia,
  email,
}) => {
  const accessToken = await getAccessToken();
  const baseUrl = getBaseUrl();

  // Referencia única del payout
  const senderBatchId = `PAYOUT-${referencia}-${Date.now()}`;

  const payload = {
    sender_batch_header: {
      sender_batch_id: senderBatchId,
      email_subject: `Retiro procesado - ${referencia}`,
      email_message: `Tu retiro de ${monto} ${currency} ha sido procesado exitosamente.`,
    },
    items: [
      {
        recipient_type: 'EMAIL',
        amount: {
          value: Number(monto).toFixed(2),
          currency: currency,
        },
        description: `Retiro de saldo Banco Exclusivo - ${banco}`,
        receiver: email, // Email del usuario para el payout
        reference_id: referencia,
        note: `Cuenta: ${numeroCuenta} - ${nombreBeneficiario}`,
      },
    ],
  };

  try {
    console.log('💰 Enviando PayPal Payout...');
    console.log(`   - Monto: ${monto} ${currency}`);
    console.log(`   - Beneficiario: ${nombreBeneficiario} (${email})`);
    console.log(`   - Cuenta: ${banco} - ${numeroCuenta}`);

    const response = await axios.post(
      `${baseUrl}/v1/payments/payouts`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Payout creado exitosamente');
    console.log(`   - Batch ID: ${response.data.batch_header.payout_batch_id}`);

    return {
      success: true,
      batchId: response.data.batch_header.payout_batch_id,
      estado: response.data.batch_header.batch_status,
      referencia: senderBatchId,
      respuesta: response.data,
    };
  } catch (error) {
    console.error('❌ Error en PayPal Payout:', error.response?.data || error.message);
    const details = error.response?.data || error.message;
    throw new Error(`PayPal Payouts error: ${JSON.stringify(details)}`);
  }
};

// Obtener estado de un payout
const obtenerEstadoPayout = async (batchId) => {
  const accessToken = await getAccessToken();
  const baseUrl = getBaseUrl();

  try {
    const response = await axios.get(
      `${baseUrl}/v1/payments/payouts/${batchId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    const details = error.response?.data || error.message;
    throw new Error(`PayPal get payout status error: ${JSON.stringify(details)}`);
  }
};

// Validar si el email es válido para PayPal Payouts
const validarEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

module.exports = {
  crearPayout,
  obtenerEstadoPayout,
  validarEmail,
  getAccessToken,
};
