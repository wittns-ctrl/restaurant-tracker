import { useMemo, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { Loader2, CreditCard } from 'lucide-react';

// Cache one Stripe instance per publishable key (test vs live, key rotation),
// instead of a single global that ignored which key it was created with.
const stripePromiseCache = new Map();
function getStripePromise(publishableKey) {
  if (!stripePromiseCache.has(publishableKey)) {
    stripePromiseCache.set(publishableKey, loadStripe(publishableKey));
  }
  return stripePromiseCache.get(publishableKey);
}

function PaymentForm({ onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    try {
      // Stripe confirms the payment against the intent created by the backend.
      // Our own /payments/confirm is only called by the parent AFTER this
      // reports succeeded, so the backend never sees an unpaid intent.
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.href },
        redirect: 'if_required',
      });

      if (error) {
        onError(error.message || 'Payment failed. Please try again.');
      } else if (paymentIntent && paymentIntent.status !== 'succeeded') {
        onError(`Payment is ${paymentIntent.status.replace(/_/g, ' ')} — please try another method.`);
      } else {
        onSuccess(paymentIntent?.id);
      }
    } catch (err) {
      onError(err.message || 'Unexpected payment error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button
        type="submit"
        className="dash-btn-primary"
        style={{ width: '100%', marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        disabled={!stripe || submitting}
      >
        {submitting
          ? (<><Loader2 size={18} className="animate-spin" />Processing payment…</>)
          : (<><CreditCard size={18} />Pay securely</>)}
      </button>
    </form>
  );
}

/**
 * Renders the Stripe Elements payment form for a created PaymentIntent.
 *
 * Props:
 *  - publishableKey: Stripe publishable key returned by POST /payments/create-intent
 *  - clientSecret:   the intent's client_secret (same response)
 *  - onSuccess:      (paymentIntentId) => void — fired only after Stripe reports succeeded
 *  - onError:        (message) => void
 */
const StripeCheckout = ({ publishableKey, clientSecret, onSuccess, onError }) => {
  const stripePromise = useMemo(
    () => getStripePromise(publishableKey),
    [publishableKey],
  );

  // Remount the Elements tree if a different intent (clientSecret) is issued.
  const elementKey = clientSecret || 'none';
  const stripePrimary = typeof window !== 'undefined'
    ? getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#F5A623'
    : '#F5A623';

  if (!stripePromise || !clientSecret) {
    return (
      <p style={{ color: '#d97706', fontSize: '0.85rem' }}>
        Payment form unavailable — Stripe is not configured correctly.
      </p>
    );
  }

  return (
    <Elements
      key={elementKey}
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'night',
          variables: { colorPrimary: stripePrimary, colorBackground: '#151815' },
        },
      }}
    >
      <PaymentForm onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
};

export default StripeCheckout;
