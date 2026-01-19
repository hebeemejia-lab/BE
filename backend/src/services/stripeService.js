const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const stripeService = {
  // Crear cliente en Stripe
  crearCliente: async (usuario) => {
    try {
      const cliente = await stripe.customers.create({
        email: usuario.email,
        name: usuario.nombre,
        metadata: {
          usuarioId: usuario.id,
          cedula: usuario.cedula,
        },
      });
      return cliente;
    } catch (error) {
      console.error('Error creando cliente en Stripe:', error.message);
      throw error;
    }
  },

  // Procesar transferencia bancaria
  procesarTransferencia: async (transferenciaData) => {
    try {
      // Crear payout (transferencia) a la cuenta bancaria
      const payout = await stripe.payouts.create({
        amount: Math.round(transferenciaData.monto * 100), // Convertir a centavos
        currency: 'usd',
        destination: transferenciaData.bancoId, // ID de la cuenta bancaria en Stripe
        statement_descriptor: transferenciaData.concepto || 'Transferencia Banco Exclusivo',
        metadata: {
          numeroCuenta: transferenciaData.numeroCuenta,
          nombreCuenta: transferenciaData.nombreCuenta,
          banco: transferenciaData.banco,
        },
      });
      return payout;
    } catch (error) {
      console.error('Error procesando transferencia:', error.message);
      throw error;
    }
  },

  // Crear token de banco (para testing)
  crearTokenBanco: async (numeroCuenta, routingNumber, nombreCuenta) => {
    try {
      const token = await stripe.tokens.create({
        bank_account: {
          country: 'US',
          currency: 'usd',
          account_number: numeroCuenta,
          routing_number: routingNumber,
          account_holder_name: nombreCuenta,
          account_holder_type: 'individual',
        },
      });
      return token;
    } catch (error) {
      console.error('Error creando token de banco:', error.message);
      throw error;
    }
  },

  // Crear cuenta bancaria conectada (para destinatarios)
  crearCuentaBancaria: async (clienteId, tokenData) => {
    try {
      const cuenta = await stripe.customers.createSource(clienteId, {
        source: tokenData.token,
      });
      return cuenta;
    } catch (error) {
      console.error('Error creando cuenta bancaria:', error.message);
      throw error;
    }
  },

  // Obtener detalles de transferencia
  obtenerTransferencia: async (transferenceId) => {
    try {
      const transferencia = await stripe.payouts.retrieve(transferenceId);
      return transferencia;
    } catch (error) {
      console.error('Error obteniendo transferencia:', error.message);
      throw error;
    }
  },

  // Refundar transferencia
  refundarTransferencia: async (transferenceId, monto) => {
    try {
      const refund = await stripe.refunds.create({
        amount: Math.round(monto * 100),
        metadata: {
          payoutId: transferenceId,
        },
      });
      return refund;
    } catch (error) {
      console.error('Error reembolsando:', error.message);
      throw error;
    }
  },

  // Verificar saldo disponible
  verificarSaldoDisponible: async () => {
    try {
      const balance = await stripe.balance.retrieve();
      return balance;
    } catch (error) {
      console.error('Error obteniendo saldo:', error.message);
      throw error;
    }
  },

  // Crear sesión de pago (para transferencias internas)
  crearSesionPago: async (monto, email, metadata) => {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card', 'us_bank_account'],
        mode: 'payment',
        customer_email: email,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Transferencia Bancaria',
                description: metadata.concepto || 'Transferencia',
              },
              unit_amount: Math.round(monto * 100),
            },
            quantity: 1,
          },
        ],
        success_url: process.env.FRONTEND_URL + '/dashboard?success=true',
        cancel_url: process.env.FRONTEND_URL + '/transferencias?cancel=true',
        metadata: metadata,
      });
      return session;
    } catch (error) {
      console.error('Error creando sesión de pago:', error.message);
      throw error;
    }
  },
};

module.exports = stripeService;
