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
          gateway: 'braintree',
          gatewayMerchantId: process.env.REACT_APP_BRAINTREE_MERCHANT_ID || 'sandbox_merchant_id',
        },
      },
    },
  ],
  merchantInfo: {
    merchantId: process.env.REACT_APP_BRAINTREE_MERCHANT_ID || 'sandbox_merchant_id',
    merchantName: 'Banco Exclusivo',
  },
  transactionInfo: {
    totalPriceStatus: 'FINAL',
    totalPriceLabel: 'Total',
    totalPrice: '10.00',
    currencyCode: 'USD',
    countryCode: 'US',
  },
};

function GooglePayButton({ monto }) {
  const buttonRef = useRef(null);
  const [error, setError] = React.useState('');

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://pay.google.com/gp/p/js/pay.js';
    script.async = true;
    script.onload = () => {
      if (window.google) {
        const paymentsClient = new window.google.payments.api.PaymentsClient({
          environment: 'PRODUCTION',
        });
        const config = {
          ...googlePayConfig,
          transactionInfo: {
            ...googlePayConfig.transactionInfo,
            totalPrice: parseFloat(monto || 0).toFixed(2),
          },
        };
        paymentsClient.isReadyToPay({
          allowedPaymentMethods: config.allowedPaymentMethods,
        }).then(function(response) {
          if (response.result) {
            paymentsClient.createButton({
              onClick: () => {
                paymentsClient.loadPaymentData(config)
                  .then(paymentData => {
                    alert('Pago exitoso (token real): ' + JSON.stringify(paymentData));
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
          } else {
            setError('Google Pay no está disponible en este navegador o configuración.');
          }
        }).catch(() => {
          setError('Error al verificar disponibilidad de Google Pay. Revisa tus credenciales o configuración.');
        });
      } else {
        setError('No se pudo cargar el script de Google Pay.');
      }
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [monto]);

  return (
    <>
      <div ref={buttonRef}></div>
      {error && (
        <div style={{ color: 'red', marginTop: 8, fontWeight: 'bold' }}>
          {error}
        </div>
      )}
    </>
  );
}
export default GooglePayButton;
