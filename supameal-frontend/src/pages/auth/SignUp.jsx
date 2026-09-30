import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, EyeOff, Eye, User, Phone, Utensils } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';
import AuthLayout from '../../layouts/AuthLayout';
import Button from '../../components/Button/Button';
import { useAuth } from '../../context/AuthContext';
import './AuthForm.css';

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', password: '' });
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signup({
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        password: form.password,
        phone: form.phone.trim(),
        role: 'customer',
      });
      localStorage.setItem('pendingVerificationEmail', form.email);
      navigate('/verify-otp');
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Create your account and" 
      subtitle="start your delicious journey."
    >
      <div className="auth-form-header">
        <Utensils size={32} className="auth-form-icon" style={{ color: '#8b7355' }} />
        <h3>Create Account</h3>
        <p>Let's get you started</p>
      </div>

      {error && <p className="auth-form-error">{error}</p>}

      <form onSubmit={handleSignUp}>
        <div className="auth-input-group">
          <div className="auth-input-wrapper">
            <User size={18} className="auth-input-icon" />
            <input type="text" placeholder="First Name" className="auth-input" required value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} />
          </div>
        </div>

        <div className="auth-input-group">
          <div className="auth-input-wrapper">
            <User size={18} className="auth-input-icon" />
            <input type="text" placeholder="Last Name" className="auth-input" required value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} />
          </div>
        </div>

        <div className="auth-input-group">
          <div className="auth-input-wrapper">
            <Phone size={18} className="auth-input-icon" />
            <input type="tel" placeholder="Phone Number" className="auth-input" required value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
          </div>
        </div>

        <div className="auth-input-group">
          <div className="auth-input-wrapper">
            <Mail size={18} className="auth-input-icon" />
            <input type="email" placeholder="Email Address" className="auth-input" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
        </div>

        <div className="auth-input-group">
          <div className="auth-input-wrapper">
            <Lock size={18} className="auth-input-icon" />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password" 
              className="auth-input" 
              required
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            />
            <button 
              type="button" 
              className="auth-input-action"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
        </div>

        <Button variant="primary" className="auth-submit-btn" type="submit" disabled={loading}>
          <Utensils size={18} style={{ marginRight: '8px' }}/> {loading ? 'Creating...' : 'Sign Up'}
        </Button>
      </form>

      <div className="auth-form-divider">
        <span>OR</span>
      </div>

      <button type="button" className="auth-social-btn" onClick={loginWithGoogle}>
        <FaGoogle /> Continue with Google
      </button>

      <div className="auth-footer" style={{ justifyContent: 'center', gap: '0.5rem' }}>
        <span>Already have an account?</span>
        <Link to="/login" className="auth-footer-link" style={{ color: 'var(--primary)' }}>
          Login
        </Link>
      </div>
    </AuthLayout>
  );
};

export default SignUp;
