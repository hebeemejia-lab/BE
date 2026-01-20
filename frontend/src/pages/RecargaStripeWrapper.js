// Stripe Elements wrapper for React
import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import RecargaStripeForm from './RecargaStripeForm';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

export default function RecargaStripeWrapper() {
  return (
    <Elements stripe={stripePromise}>
      <RecargaStripeForm />
    </Elements>
  );
}
