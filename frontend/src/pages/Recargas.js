import React from 'react';
import RecargaStripeWrapper from './RecargaStripeWrapper';

export default function Recargas() {
  return (
    <div className="recargas-container">
      <h2>Recargar saldo</h2>
      <RecargaStripeWrapper />
    </div>
  );
}
