import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Store, MapPin, Phone, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import AuthLayout from '../../layouts/AuthLayout';
import Button from '../../components/Button/Button';
import Loader from '../../components/Loader/Loader';
import { useAuth } from '../../context/AuthContext';
import { restaurantsApi } from '../../services/api';
import { userHasRole } from '../../utils/auth';
import '../auth/AuthForm.css';

const accountSignupPath = '/signup?returnTo=%2Fregister-restaurant';
const ownerLoginPath = '/owner-login?returnTo=%2Fregister-restaurant';
const registrationDraftKey = 'restaurantRegistrationDraft';

const loadRegistrationDraft = () => {
  const emptyForm = {
    restaurantName: '', contactNumber: '', fullAddress: '',
  };
  try {
    return { ...emptyForm, ...JSON.parse(sessionStorage.getItem(registrationDraftKey) || '{}') };
  } catch {
    return emptyForm;
  }
};

const RegisterRestaurant = () => {
  const { user, isAuthenticated, logout, loginWithCredentials } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState(loadRegistrationDraft);
  const canRegister = isAuthenticated && (userHasRole(user, 'customer') || userHasRole(user, 'owner'));

  useEffect(() => {
    try {
      sessionStorage.setItem(registrationDraftKey, JSON.stringify(form));
    } catch {
      // Registration still works when browser storage is unavailable.
    }
  }, [form]);

  const handleRegister = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      let accountUser = user;
      if (!canRegister) {
        if (isAuthenticated) {
          throw new Error('This account cannot register a restaurant. Sign out and use a customer or owner account.');
        }
        accountUser = await loginWithCredentials(ownerEmail.trim(), ownerPassword);
        if (!userHasRole(accountUser, 'customer')) {
          await logout();
          throw new Error('Sign in with a customer account to submit a restaurant application.');
        }
        setOwnerPassword('');
      }

      await restaurantsApi.register({
        name: form.restaurantName.trim(),
        description: `${form.restaurantName.trim()} - registered via SupaMeal`,
        ownerId: accountUser.id,
        location: {
          address: form.fullAddress.trim(),
          city: 'Downtown',
          latitude: 0,
          longitude: 0,
        },
        phone: form.contactNumber.trim(),
        opening: 'Mon-Sun: 10:00 AM - 10:00 PM',
        capacity: 50,
        cuisine: 'International',
        images: [],
      });
      sessionStorage.removeItem(registrationDraftKey);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Restaurant registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Loader text="Registering your restaurant..." />;

  return (
    <AuthLayout
      className="auth-layout--signup auth-layout--owner-register"
      title="Partner with us"
      subtitle="Reach more customers and grow your business."
    >
      <div className="signup-form-content">
      <div className="auth-form-header">
        <Store size={32} className="auth-form-icon" />
        <h3>Register Restaurant</h3>
        <p>Join the SupaMeal network</p>
      </div>

      {submitted ? (
        <div role="status" aria-live="polite" className="owner-register-signed-in">
          <strong>Application submitted for review.</strong>
          <p>Your restaurant will appear in the owner portal after an administrator approves it.</p>
          <Link to="/customer/dashboard" className="auth-footer-link">Return to customer dashboard</Link>
        </div>
      ) : <>
      {error && <p role="alert" className="auth-form-error">{error}</p>}

      {canRegister && (
        <p className="owner-register-signed-in">
          Signed in as <strong>{user.name || user.email}</strong>. Your application will be reviewed before owner access is enabled.
        </p>
      )}
      {isAuthenticated && user?.role === 'admin' && (
        <button type="button" className="auth-gate-signout" onClick={logout}>
          Sign out to use a customer account
        </button>
      )}
          <form onSubmit={handleRegister}>
            <div className="auth-input-group">
              <label htmlFor="owner-email">Customer Account Email</label>
              <div className="auth-input-wrapper">
                <Mail size={18} className="auth-input-icon" />
                <input
                  id="owner-email"
                  type="email"
                  autoComplete="username"
                  placeholder="you@example.com"
                  className="auth-input"
                  required={!isAuthenticated}
                  readOnly={isAuthenticated}
                  value={isAuthenticated ? (user?.email || '') : ownerEmail}
                  onChange={event => {
                    setOwnerEmail(event.target.value);
                  }}
                />
              </div>
            </div>
            {!isAuthenticated && (
              <div className="auth-input-group">
                <label htmlFor="owner-password">Customer Account Password</label>
                <div className="auth-input-wrapper">
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="owner-password"
                    type={showOwnerPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your customer account password"
                    className="auth-input"
                    required
                    value={ownerPassword}
                    onChange={event => setOwnerPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    className="auth-input-action"
                    onClick={() => setShowOwnerPassword(value => !value)}
                    aria-label={showOwnerPassword ? 'Hide password' : 'Show password'}
                  >
                    {showOwnerPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </div>
            )}
            <div className="auth-input-group">
              <label htmlFor="restaurant-name">Restaurant Name</label>
              <div className="auth-input-wrapper">
                <Store size={18} className="auth-input-icon" />
                <input id="restaurant-name" type="text" placeholder="Restaurant Name" className="auth-input" required minLength={2} maxLength={120} value={form.restaurantName} onChange={e => setForm(p => ({ ...p, restaurantName: e.target.value }))} />
              </div>
            </div>
            <div className="auth-input-group">
              <label htmlFor="restaurant-phone">Contact Number</label>
              <div className="auth-input-wrapper">
                <Phone size={18} className="auth-input-icon" />
                <input id="restaurant-phone" type="tel" placeholder="Contact Number" className="auth-input" required pattern="[+0-9 ()-]{7,20}" value={form.contactNumber} onChange={e => setForm(p => ({ ...p, contactNumber: e.target.value }))} />
              </div>
            </div>
            <div className="auth-input-group">
              <label htmlFor="restaurant-address">Full Address</label>
              <div className="auth-input-wrapper">
                <MapPin size={18} className="auth-input-icon" />
                <input id="restaurant-address" type="text" placeholder="Street, building, or neighborhood" className="auth-input" required minLength={3} value={form.fullAddress} onChange={e => setForm(p => ({ ...p, fullAddress: e.target.value }))} />
              </div>
            </div>


            <Button variant="primary" className="auth-submit-btn" type="submit">
              Register & Continue
            </Button>
          </form>
          <div className="auth-footer owner-register-footer">
            <span>Already a partner?</span>
            <Link to={ownerLoginPath} className="auth-footer-link">Owner Login</Link>
          </div>
          <div className="auth-footer owner-register-footer">
            <span>Don’t have a user account?</span>
            <Link to={accountSignupPath} className="auth-footer-link">Sign up</Link>
          </div>
      </>}
      </div>
    </AuthLayout>
  );
};

export default RegisterRestaurant;
