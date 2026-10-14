import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, MapPin, Phone, Mail, UserRound, FileText, Clock3, Users, Utensils } from 'lucide-react';
import AuthLayout from '../../layouts/AuthLayout';
import Button from '../../components/Button/Button';
import Loader from '../../components/Loader/Loader';
import { useAuth } from '../../context/AuthContext';
import { restaurantsApi } from '../../services/api';
import '../auth/AuthForm.css';

const accountSignupPath = '/signup?returnTo=%2Fregister-restaurant';
const ownerLoginPath = '/owner-login?returnTo=%2Fregister-restaurant';

const RegisterRestaurant = () => {
  const { user, isAuthenticated, updateUser, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    restaurantName: '',
    contactNumber: '',
    fullAddress: '',
    city: '',
    description: '',
    opening: '',
    capacity: '50',
    cuisine: '',
  });
  const navigate = useNavigate();
  const canRegister = isAuthenticated && ['customer', 'owner'].includes(user?.role);

  const handleRegister = async (event) => {
    event.preventDefault();
    if (!canRegister) {
      setError('Create or sign in to your account before registering a restaurant.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const registration = await restaurantsApi.register({
        name: form.restaurantName.trim(),
        description: form.description.trim(),
        ownerId: user.id,
        location: { address: form.fullAddress.trim(), city: form.city.trim(), latitude: 0, longitude: 0 },
        phone: form.contactNumber.trim(),
        opening: form.opening.trim(),
        capacity: Number(form.capacity),
        cuisine: form.cuisine.trim() || 'International',
        images: [],
      });
      if (registration?.ownerAccount) updateUser(registration.ownerAccount);
      navigate('/owner/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Restaurant registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Loader text="Registering your restaurant..." />;

  return (
    <AuthLayout
      className="auth-layout--owner-register"
      title="Partner with us"
      subtitle="Reach more customers and grow your business."
    >
      <div className="auth-form-header">
        <Store size={32} className="auth-form-icon" />
        <h3>Register Restaurant</h3>
        <p>Join the SupaMeal network</p>
      </div>

      {error && <p role="alert" className="auth-form-error">{error}</p>}

      {!canRegister ? (
        <div className="owner-register-gate">
          <p>
            You need a SupaMeal account before you can register a restaurant.
            Sign up first, then return here to submit your restaurant details.
          </p>
          {isAuthenticated && user?.role === 'admin' && (
            <button type="button" className="auth-gate-signout" onClick={logout}>
              Sign out
            </button>
          )}
          <div className="auth-footer owner-register-footer">
            <span>Already a partner?</span>
            <Link to={ownerLoginPath} className="auth-footer-link">Owner Login</Link>
          </div>
          <div className="auth-footer owner-register-footer">
            <span>Don’t have a user account?</span>
            <Link to={accountSignupPath} className="auth-footer-link">Sign up</Link>
          </div>
        </div>
      ) : (
        <>
          <p className="owner-register-signed-in">
            Signed in as <strong>{user.name || user.email}</strong>. This account will be enabled for restaurant owner access after registration.
          </p>
          <form onSubmit={handleRegister}>
            <div className="auth-input-group">
              <label htmlFor="restaurant-name">Restaurant Name</label>
              <div className="auth-input-wrapper">
                <Store size={18} className="auth-input-icon" />
                <input id="restaurant-name" type="text" placeholder="Restaurant Name" className="auth-input" required minLength={2} maxLength={120} value={form.restaurantName} onChange={e => setForm(p => ({ ...p, restaurantName: e.target.value }))} />
              </div>
            </div>
            <div className="auth-input-group">
              <label htmlFor="owner-name">Owner Full Name</label>
              <div className="auth-input-wrapper">
                <UserRound size={18} className="auth-input-icon" />
                <input id="owner-name" type="text" className="auth-input" value={user?.name || ''} readOnly aria-describedby="owner-account-note" />
              </div>
            </div>
            <div className="auth-input-group">
              <label htmlFor="business-email">Business Email</label>
              <div className="auth-input-wrapper">
                <Mail size={18} className="auth-input-icon" />
                <input id="business-email" type="email" className="auth-input" value={user?.email || ''} readOnly aria-describedby="owner-account-note" />
              </div>
              <small id="owner-account-note">Owner details come from your signed-in SupaMeal account.</small>
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
            <div className="auth-input-group">
              <label htmlFor="restaurant-city">City</label>
              <div className="auth-input-wrapper">
                <MapPin size={18} className="auth-input-icon" />
                <input id="restaurant-city" type="text" placeholder="City" className="auth-input" required minLength={2} value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
              </div>
            </div>
            <div className="auth-input-group">
              <label htmlFor="restaurant-description">Restaurant Description</label>
              <div className="auth-input-wrapper">
                <FileText size={18} className="auth-input-icon" />
                <textarea id="restaurant-description" placeholder="Tell customers about your restaurant" className="auth-input owner-register-description" required minLength={10} maxLength={1000} rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
            </div>
            <div className="auth-input-group">
              <label htmlFor="restaurant-opening">Opening Hours</label>
              <div className="auth-input-wrapper">
                <Clock3 size={18} className="auth-input-icon" />
                <input id="restaurant-opening" type="text" placeholder="e.g. Mon–Sun, 10:00 AM–10:00 PM" className="auth-input" required minLength={3} value={form.opening} onChange={e => setForm(p => ({ ...p, opening: e.target.value }))} />
              </div>
            </div>
            <div className="auth-input-group">
              <label htmlFor="restaurant-capacity">Seating Capacity</label>
              <div className="auth-input-wrapper">
                <Users size={18} className="auth-input-icon" />
                <input id="restaurant-capacity" type="number" placeholder="50" className="auth-input" required min={1} max={10000} value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))} />
              </div>
            </div>
            <div className="auth-input-group">
              <label htmlFor="restaurant-cuisine">Cuisine Type</label>
              <div className="auth-input-wrapper">
                <Utensils size={18} className="auth-input-icon" />
                <input id="restaurant-cuisine" type="text" placeholder="e.g. Rwandan, Italian, Grill" className="auth-input" value={form.cuisine} onChange={e => setForm(p => ({ ...p, cuisine: e.target.value }))} />
              </div>
            </div>
            <Button variant="primary" className="auth-submit-btn" type="submit">
              Submit & Open Dashboard
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
        </>
      )}
    </AuthLayout>
  );
};

export default RegisterRestaurant;
