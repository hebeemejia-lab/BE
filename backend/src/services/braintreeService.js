// Servicio para procesar pagos con Braintree (Google Pay)
const braintree = require('braintree');

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Production,
  merchantId: process.env.PAYPAL_CLIENT_ID,
  publicKey: process.env.PAYPAL_CLIENT_ID,
  privateKey: process.env.PAYPAL_CLIENT_SECRET,
});

async function procesarPagoGooglePay(nonce, amount) {
  return gateway.transaction.sale({
    amount,
    paymentMethodNonce: nonce,
    options: { submitForSettlement: true },
  });
}

module.exports = { procesarPagoGooglePay };
