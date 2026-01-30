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

  const payload = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: currency,
          value: Number(monto).toFixed(2),
        },
        description: 'Recarga de saldo Banco Exclusivo',
        custom_id: referencia,
      },
    ],
    application_context: {
      return_url: returnUrl,
      cancel_url: cancelUrl,
      user_action: 'PAY_NOW',
    },
  };

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

    return response.data;
  } catch (error) {
    const details = error.response?.data || error.message;
    throw new Error(`PayPal capture error: ${JSON.stringify(details)}`);
  }
};

module.exports = {
  crearOrden,
  capturarOrden,
};
