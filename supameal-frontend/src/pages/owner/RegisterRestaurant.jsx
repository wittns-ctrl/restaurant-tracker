import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Store, MapPin, Phone, Mail, User } from 'lucide-react';
import AuthLayout from '../../layouts/AuthLayout';
import Button from '../../components/Button/Button';
import Loader from '../../components/Loader/Loader';
import { useAuth } from '../../context/AuthContext';
import { authApi, restaurantsApi } from '../../services/api';
import '../auth/AuthForm.css';

const RegisterRestaurant = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    restaurantName: '', ownerName: '', businessEmail: '', contactNumber: '', fullAddress: '', password: 'Password123!',
  });
  const { loginWithCredentials } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const signupRes = await authApi.signup({
        name: form.ownerName,
        email: form.businessEmail,
        password: form.password,
        phone: form.contactNumber.trim(),
        role: 'owner',
      });
      if (!signupRes.user || !signupRes.accessToken) {
        await loginWithCredentials(form.businessEmail, form.password);
      }
      const user = JSON.parse(localStorage.getItem('user'));
      await restaurantsApi.register({
        name: form.restaurantName,
        description: `${form.restaurantName} - registered via SupaMeal`,
        ownerId: user.id,
        // The form only collects a free-text address; coordinates stay 0
        // until the owner sets a precise location from their dashboard.
        location: { address: form.fullAddress, city: 'Downtown', latitude: 0, longitude: 0 },
        phone: form.contactNumber.trim(),
        opening: 'Mon-Sun: 10:00 AM - 10:00 PM',
        capacity: 50,
        images: [],
      });
      navigate('/owner/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Loader text="Setting up your restaurant..." />;

  return (
    <AuthLayout 
      title="Partner with us" 
      subtitle="Reach more customers and grow your business."
    >
      <div className="auth-form-header">
        <Store size={32} className="auth-form-icon" />
        <h3>Register Restaurant</h3>
        <p>Join the SupaMeal network</p>
      </div>

      {error && <p style={{ color: '#e05555', textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}

      <form onSubmit={handleRegister}>
        <div className="auth-input-group">
          <div className="auth-input-wrapper">
            <Store size={18} className="auth-input-icon" />
            <input type="text" placeholder="Restaurant Name" className="auth-input" required value={form.restaurantName} onChange={e => setForm(p => ({ ...p, restaurantName: e.target.value }))} />
          </div>
        </div>

        <div className="auth-input-group">
          <div className="auth-input-wrapper">
            <User size={18} className="auth-input-icon" />
            <input type="text" placeholder="Owner Full Name" className="auth-input" required value={form.ownerName} onChange={e => setForm(p => ({ ...p, ownerName: e.target.value }))} />
          </div>
        </div>

        <div className="auth-input-group">
          <div className="auth-input-wrapper">
            <Mail size={18} className="auth-input-icon" />
            <input type="email" placeholder="Business Email" className="auth-input" required value={form.businessEmail} onChange={e => setForm(p => ({ ...p, businessEmail: e.target.value }))} />
          </div>
        </div>

        <div className="auth-input-group">
          <div className="auth-input-wrapper">
            <Phone size={18} className="auth-input-icon" />
            <input type="tel" placeholder="Contact Number" className="auth-input" required value={form.contactNumber} onChange={e => setForm(p => ({ ...p, contactNumber: e.target.value }))} />
          </div>
        </div>

        <div className="auth-input-group">
          <div className="auth-input-wrapper">
            <MapPin size={18} className="auth-input-icon" />
            <input type="text" placeholder="Full Address" className="auth-input" required value={form.fullAddress} onChange={e => setForm(p => ({ ...p, fullAddress: e.target.value }))} />
          </div>
        </div>

        <Button variant="primary" className="auth-submit-btn" type="submit">
          Submit & Open Dashboard
        </Button>
      </form>
      
      <div className="auth-footer" style={{ justifyContent: 'center', marginTop: '1.5rem', gap: '0.5rem' }}>
        <span>Already a partner?</span>
        <Link to="/owner-login" className="auth-footer-link" style={{ color: 'var(--primary)' }}>
          Owner Login
        </Link>
      </div>
    </AuthLayout>
  );
};

export default RegisterRestaurant;
