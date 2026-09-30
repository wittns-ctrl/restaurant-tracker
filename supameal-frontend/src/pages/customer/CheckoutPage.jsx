import { Suspense, useState, lazy, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Tag, Clock, CheckCircle, CreditCard, Loader2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ordersApi, promosApi, paymentsApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
// Stripe.js (~50 kB) is fetched only when the real-Stripe payment panel mounts
const StripeCheckout = lazy(() => import('../../components/StripeCheckout'));
import './dashboard.css';

const TIME_SLOTS = ['ASAP (25-35 min)', '12:00 PM', '12:30 PM', '1:00 PM', '7:00 PM', '7:30 PM', '8:00 PM'];

const CheckoutPage = ({ setActiveTab }) => {
  const navigate = useNavigate();
  const [promo, setPromo] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);
  const [placed, setPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState('');
  const [address, setAddress] = useState({ street: '', apartment: '', city: '', postalCode: '', instructions: '' });
  const [paymentState, setPaymentState] = useState('idle');
  const [paymentWarning, setPaymentWarning] = useState('');
  // Stripe intent awaiting user payment: { paymentIntentId, clientSecret, publishableKey }
  const [pendingPayment, setPendingPayment] = useState(null);
  const { cartItems, subtotal, clearCart, selectedRestaurantId } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();

  // navigate() fallback when rendered from the router without a tab setter
  const go = (tab, path) => (setActiveTab ? setActiveTab(tab) : navigate(path));

  const delivery = cartItems.length > 0 ? 3.99 : 0;
  // Discount comes from the backend's validation response — never invented locally
  const discount = promoApplied ? promoDiscount : 0;
  const total = Math.max(0, subtotal + delivery - discount);

  const applyPromo = async () => {
    if (!promo.trim()) {
      showToast('Enter a promo code first', 'error');
      return;
    }
    try {
      const res = await promosApi.validate(promo.trim(), subtotal);
      if (res.valid) {
        setPromoApplied(true);
        setPromoDiscount(res.discount || 0);
        showToast(res.message || `Promo applied — $${(res.discount || 0).toFixed(2)} off`, 'success');
      } else {
        showToast(res.message || 'Invalid promo code', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Invalid promo code', 'error');
    }
  };

  const handlePlaceOrder = async () => {
    if (!user?.id || !selectedRestaurantId) return;
    if (!address.street || !address.city || !address.postalCode) {
      showToast('Please fill in your full delivery address', 'error');
      return;
    }

    setPaymentState('creating');
    setPaymentWarning('');
    try {
      const order = await ordersApi.create({
        customerId: user.id,
        restaurantId: selectedRestaurantId,
        items: cartItems.map(i => ({ menuItemId: i.id, qty: i.qty })),
        deliveryAddress: address,
        timeSlot,
        promoCode: promoApplied ? promo.trim() : undefined,
      });

      setPaymentState('intent');
      const payment = await paymentsApi.createIntent(order.orderId || order.id, {
        customerName: user.name || '',
      });

      if (payment.mode === 'fake') {
        // Dev mode — no Stripe keys configured on backend
        if (payment.warning) setPaymentWarning(payment.warning);
        setPaymentState('confirming');
        const confirm = await paymentsApi.confirm(payment.paymentIntentId);
        if (confirm.success) {
          setPlacedOrderId((order.orderId || order.id || '').slice(-4));
          setPlaced(true);
          setPaymentState('paid');
          clearCart();
          showToast('Order placed (dev mode)', 'success');
          return;
        }
        throw new Error('Payment confirmation failed');
      }

      const stripeKey = payment.publishableKey;
      if (!stripeKey) {
        throw new Error('Missing Stripe publishable key on server');
      }
      if (!payment.clientSecret) {
        throw new Error('Missing payment client secret from server');
      }

      // Real Stripe flow: mount Stripe Elements and let the user pay the
      // intent first. Our backend confirm only runs after Stripe reports the
      // intent as succeeded (webhooks also keep the server in sync).
      setPendingPayment({
        paymentIntentId: payment.paymentIntentId,
        clientSecret: payment.clientSecret,
        publishableKey: stripeKey,
      });
      setPaymentState('awaiting_confirm');
    } catch (err) {
      console.error(err);
      setPaymentState('idle');
      showToast(err.message || 'Failed to place order', 'error');
    }
  };

  // Runs ONLY after Stripe Elements reports the intent as succeeded
  const handleStripeSuccess = useCallback(async (stripePaymentIntentId) => {
    const intentId = stripePaymentIntentId || pendingPayment?.paymentIntentId;
    if (!intentId) {
      showToast('Payment succeeded but no payment reference was returned', 'error');
      return;
    }
    try {
      setPaymentState('confirming');
      const confirm = await paymentsApi.confirm(intentId);
      if (!confirm.success) throw new Error('Payment not completed');
      setPlacedOrderId(String(intentId).slice(-4));
      setPlaced(true);
      setPaymentState('paid');
      setPendingPayment(null);
      clearCart();
      showToast('Order placed successfully!', 'success');
    } catch (err) {
      console.error(err);
      setPaymentState('idle');
      setPendingPayment(null);
      showToast(err.message || 'Could not finalize your order after payment', 'error');
    }
  }, [pendingPayment, showToast, clearCart]);

  const handleStripeError = useCallback((message) => {
    // Keep the order + intent alive so the user can retry with another card —
    // the backend reuses the same pending intent on the next attempt.
    showToast(message || 'Payment failed. Please try again.', 'error');
  }, [showToast]);

  const handleCancelPayment = useCallback(() => {
    setPendingPayment(null);
    setPaymentState('idle');
  }, []);

  if (placed) {
    return (
      <>
        <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <CheckCircle size={80} color="var(--dash-accent, #C6F135)" style={{ marginBottom: '1.5rem' }} />
          <h2 style={{ color: 'var(--dash-text, #fff)', fontSize: '2rem', marginBottom: '0.75rem' }}>Order Placed!</h2>
          <p style={{ color: 'var(--dash-muted, #8a8a8a)', maxWidth: 400, margin: '0 auto 2rem', lineHeight: 1.7 }}>
            Your order <strong style={{ color: 'var(--dash-accent, #C6F135)' }}>#{placedOrderId}</strong> has been confirmed. Estimated delivery: 25–35 minutes.
          </p>
          {paymentWarning && (
            <p style={{ color: '#d97706', maxWidth: 460, margin: '0 auto 2rem', fontSize: '0.85rem' }}>
              ℹ️ {paymentWarning}
            </p>
          )}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="dash-btn-primary" onClick={() => go('order-tracking', `/order-tracking/${placedOrderId}`)}>Track Order</button>
            <button className="dash-btn-outline" onClick={() => go('overview', '/customer/dashboard')}>Back to Dashboard</button>
          </div>
        </div>
      </>
    );
  }

  // Stripe Elements panel — shown while the user completes the payment
  if (pendingPayment && paymentState === 'awaiting_confirm') {
    return (
      <>
        <div className="page-header">
          <h1>Complete Payment</h1>
          <p>Your order is reserved — finish the payment to confirm it.</p>
        </div>
        <div className="dash-panel" style={{ maxWidth: 520, margin: '0 auto' }}>
          <Suspense fallback={<p style={{ color: 'var(--dash-muted, #8a8a8a)' }}>Loading payment form…</p>}>
            <StripeCheckout
              publishableKey={pendingPayment.publishableKey}
              clientSecret={pendingPayment.clientSecret}
              onSuccess={handleStripeSuccess}
              onError={handleStripeError}
            />
          </Suspense>
          <button
            className="dash-btn-outline"
            style={{ width: '100%', marginTop: '0.75rem' }}
            onClick={handleCancelPayment}
          >
            Cancel and review order
          </button>
        </div>
      </>
    );
  }

  if (cartItems.length === 0) {
    return (
      <>
        <div className="page-header">
          <h1>Checkout</h1>
          <p>Complete your order details below.</p>
        </div>
        <div className="dash-panel empty-state">
          <p>Your cart is empty. Add items before checking out.</p>
          <button className="dash-btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => go('menu', '/customer/dashboard')}>Browse Menu</button>
        </div>
      </>
    );
  }

  const isPaying = paymentState !== 'idle';

  return (
    <>
      <div className="page-header">
        <h1>Checkout</h1>
        <p>Enter your delivery address, promo code, and preferred delivery time.</p>
      </div>

      <div className="dash-grid-sidebar">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="dash-panel" style={{ marginBottom: 0 }}>
            <h3 style={{ color: 'var(--dash-text, #fff)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <MapPin size={20} color="var(--dash-accent, #C6F135)" /> Delivery Address
            </h3>
            <div className="form-row">
              <div className="dash-form-group">
                <label>Street Address *</label>
                <input className="dash-input" placeholder="123 Main Street" value={address.street} onChange={e => setAddress(p => ({ ...p, street: e.target.value }))} />
              </div>
              <div className="dash-form-group">
                <label>Apartment / Suite</label>
                <input className="dash-input" placeholder="Apt 4B (optional)" value={address.apartment} onChange={e => setAddress(p => ({ ...p, apartment: e.target.value }))} />
              </div>
            </div>
            <div className="form-row">
              <div className="dash-form-group">
                <label>City *</label>
                <input className="dash-input" placeholder="Your City" value={address.city} onChange={e => setAddress(p => ({ ...p, city: e.target.value }))} />
              </div>
              <div className="dash-form-group">
                <label>Postal Code *</label>
                <input className="dash-input" placeholder="12345" value={address.postalCode} onChange={e => setAddress(p => ({ ...p, postalCode: e.target.value }))} />
              </div>
            </div>
            <div className="dash-form-group" style={{ marginBottom: 0 }}>
              <label>Delivery Instructions (Optional)</label>
              <input className="dash-input" placeholder="Leave at door, ring bell, etc." value={address.instructions} onChange={e => setAddress(p => ({ ...p, instructions: e.target.value }))} />
            </div>
          </div>

          <div className="dash-panel" style={{ marginBottom: 0 }}>
            <h3 style={{ color: 'var(--dash-text, #fff)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Clock size={20} color="var(--dash-accent, #C6F135)" /> Delivery Time
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {TIME_SLOTS.map(slot => (
                <button key={slot} onClick={() => setTimeSlot(slot)} className={`category-pill ${timeSlot === slot ? 'active' : ''}`}>
                  {slot}
                </button>
              ))}
            </div>
          </div>

          <div className="dash-panel" style={{ marginBottom: 0 }}>
            <h3 style={{ color: 'var(--dash-text, #fff)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Tag size={20} color="var(--dash-accent, #C6F135)" /> Promo Code
            </h3>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input className="dash-input" placeholder="Enter promo code" value={promo} onChange={e => setPromo(e.target.value)} disabled={promoApplied || isPaying} style={{ flex: 1 }} />
              {promoApplied ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4caf80', fontWeight: 600 }}><CheckCircle size={18} /> Applied!</div>
              ) : (
                <button className="dash-btn-outline" style={{ padding: '0 1.5rem', whiteSpace: 'nowrap' }} onClick={applyPromo} disabled={isPaying}>Apply</button>
              )}
            </div>
            {promoApplied && <p style={{ color: '#4caf80', fontSize: '0.82rem', marginTop: '0.5rem' }}>${promoDiscount.toFixed(2)} discount applied!</p>}
          </div>
        </div>

        <div>
          <div className="dash-panel" style={{ position: 'sticky', top: 88 }}>
            <h3 style={{ color: 'var(--dash-text, #fff)', marginBottom: '1.25rem' }}>Order Summary</h3>
            {cartItems.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.85rem', color: 'var(--dash-muted, #8a8a8a)', fontSize: '0.88rem' }}>
                <span>{item.emoji} {item.name} ×{item.qty}</span>
                <span>${(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '1rem 0' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--dash-muted, #8a8a8a)', fontSize: '0.88rem' }}>
                <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--dash-muted, #8a8a8a)', fontSize: '0.88rem' }}>
                <span>Delivery Fee</span><span>${delivery.toFixed(2)}</span>
              </div>
              {promoApplied && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4caf80', fontSize: '0.88rem' }}>
                  <span>Promo Discount</span><span>-${promoDiscount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--dash-text, #fff)', fontWeight: 700, fontSize: '1.1rem' }}>
                <span>Total</span><span>${total.toFixed(2)}</span>
              </div>
            </div>
            <button className="dash-btn-primary" style={{ width: '100%', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={handlePlaceOrder} disabled={isPaying}>
              {isPaying
                ? (<><Loader2 size={18} className="animate-spin" />
                  {paymentState === 'creating' ? 'Creating order…'
                    : paymentState === 'intent' ? 'Creating payment…'
                    : paymentState === 'confirming' || paymentState === 'awaiting_confirm' ? 'Confirming payment…'
                    : 'Processing…'}</>)
                : (<><CreditCard size={18} />Place Order • ${total.toFixed(2)}</>)}
            </button>
            <p style={{ color: 'var(--dash-muted, #8a8a8a)', fontSize: '0.75rem', textAlign: 'center', marginTop: '0.75rem' }}>
              Secure payment processed via Stripe
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckoutPage;
