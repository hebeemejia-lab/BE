import React, { useEffect, useRef } from 'react';

const googlePayConfig = {
  apiVersion: 2,
  apiVersionMinor: 0,
  allowedPaymentMethods: [
    {
      type: 'CARD',
      parameters: {
        allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
        allowedCardNetworks: ['VISA', 'MASTERCARD'],
      },
      tokenizationSpecification: {
        type: 'PAYMENT_GATEWAY',
        parameters: {
          gateway: 'example', // Cambia esto por tu gateway real (ej: stripe, checkout, etc)
          gatewayMerchantId: 'exampleGatewayMerchantId',
        },
      },
    },
  ],
  merchantInfo: {
    merchantId: '12345678901234567890', // Cambia por tu merchantId real si tienes
    merchantName: 'Banco Exclusivo',
  },
  transactionInfo: {
    totalPriceStatus: 'FINAL',
    totalPriceLabel: 'Total',
    totalPrice: '10.00', // Cambia por el monto real
    currencyCode: 'USD',
    countryCode: 'US',
  },
};

function GooglePayButton() {
  const buttonRef = useRef(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://pay.google.com/gp/p/js/pay.js';
    script.async = true;
    script.onload = () => {
      if (window.google) {
        const paymentsClient = new window.google.payments.api.PaymentsClient({
          environment: 'TEST', // Cambia a 'PRODUCTION' cuando esté listo
        });
        paymentsClient.isReadyToPay({
          allowedPaymentMethods: googlePayConfig.allowedPaymentMethods,
        }).then(function(response) {
          if (response.result) {
            paymentsClient.createButton({
              onClick: () => {
                paymentsClient.loadPaymentData(googlePayConfig)
                  .then(paymentData => {
                    // Aquí recibes el token de pago
                    alert('Pago exitoso: ' + JSON.stringify(paymentData));
                  })
                  .catch(err => {
                    alert('Error en el pago: ' + err.message);
                  });
              },
              buttonColor: 'black',
              buttonType: 'buy',
            }).then(button => {
              if (buttonRef.current) {
                buttonRef.current.innerHTML = '';
                buttonRef.current.appendChild(button);
              }
            });
          }
        });
      }
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return <div ref={buttonRef}></div>;
}

export default GooglePayButton;
