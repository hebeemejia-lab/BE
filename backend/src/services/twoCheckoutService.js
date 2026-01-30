// backend/src/services/twoCheckoutService.js
const axios = require('axios');

const TWO_CHECKOUT_BASE_URL = 'https://api.2checkout.com/rest/6.0';
const TWO_CHECKOUT_MERCHANT_CODE = process.env.TWOCHECKOUT_MERCHANT_CODE;
const TWO_CHECKOUT_PRIVATE_KEY = process.env.TWOCHECKOUT_PRIVATE_KEY;
const TWO_CHECKOUT_SECRET_KEY = process.env.TWOCHECKOUT_SECRET_KEY;
const TWO_CHECKOUT_PUBLISHABLE_KEY = process.env.TWOCHECKOUT_PUBLISHABLE_KEY;

console.log('💳 2Checkout Service Configuration:');
console.log(`  Merchant Code: ${TWO_CHECKOUT_MERCHANT_CODE ? '✅ SET' : '❌ NOT SET'}`);
console.log(`  Private Key: ${TWO_CHECKOUT_PRIVATE_KEY ? '✅ SET' : '❌ NOT SET'}`);
console.log(`  Secret Key: ${TWO_CHECKOUT_SECRET_KEY ? '✅ SET' : '❌ NOT SET'}`);
console.log(`  Publishable Key: ${TWO_CHECKOUT_PUBLISHABLE_KEY ? '✅ SET' : '❌ NOT SET'}`);

// Helper to get auth header
function getAuthHeader() {
  const auth = Buffer.from(`${TWO_CHECKOUT_MERCHANT_CODE}:${TWO_CHECKOUT_PRIVATE_KEY}`).toString('base64');
  return { Authorization: `Basic ${auth}` };
}

// Create order with token
async function createOrder({ token, amount, currency = 'USD', email, reference }) {
  const body = {
    "Currency": currency,
    "Language": "en",
    "BillingDetails": {
      "Email": email
    },
    "PaymentDetails": {
      "Type": "EES_TOKEN_PAYMENT",
      "Currency": currency,
      "PaymentMethod": {
        "EesToken": token
      }
    },
    "Items": [
      {
        "Name": reference || 'Recarga',
        "Quantity": 1,
        "IsDynamic": true,
        "Tangible": false,
        "PurchaseType": "PRODUCT",
        "Price": amount
      }
    ]
  };
  const headers = {
    ...getAuthHeader(),
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  const url = `${TWO_CHECKOUT_BASE_URL}/orders/`;
  const { data } = await axios.post(url, body, { headers });
  return data;
}

module.exports = { createOrder };
