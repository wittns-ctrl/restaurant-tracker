import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Store, Mail, Lock, LogIn } from 'lucide-react';
import AuthLayout from '../../layouts/AuthLayout';
import Button from '../../components/Button/Button';
import Loader from '../../components/Loader/Loader';
import { useAuth } from '../../context/AuthContext';
import '../auth/AuthForm.css';

const OwnerLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { loginWithCredentials } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setIsLoading(true);
    try {
      const user = await loginWithCredentials(email.trim(), password);
      if (user?.role !== 'owner' && user?.role !== 'admin') {
        setError('This account is not a restaurant owner account.');
        setIsLoading(false);
        return;
      }
      navigate('/owner/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
      setIsLoading(false);
    }
  };

  if (isLoading) return <Loader text="Opening owner dashboard..." />;

  return (
    <AuthLayout
      title="Owner Portal"
      subtitle="Manage your restaurant, orders, and reservations."
    >
      <div className="auth-form-header">
        <Store size={32} className="auth-form-icon" />
        <h3>Partner Login</h3>
        <p>Access your restaurant dashboard</p>
      </div>

      {error && <p className="auth-form-error">{error}</p>}

      <form onSubmit={handleLogin}>
        <div className="auth-input-group">
          <label>Email</label>
          <div className="auth-input-wrapper">
            <Mail size={18} className="auth-input-icon" />
            <input
              type="email"
              className="auth-input"
              placeholder="owner@restaurant.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
        </div>
        <div className="auth-input-group">
          <label>Password</label>
          <div className="auth-input-wrapper">
            <Lock size={18} className="auth-input-icon" />
            <input
              type="password"
              className="auth-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
        </div>
        <Button variant="primary" className="auth-submit-btn" type="submit">
          <LogIn size={18} style={{ marginRight: 8 }} />
          Sign In
        </Button>
      </form>

      <div className="auth-footer" style={{ justifyContent: 'center', marginTop: '1.5rem', gap: '0.5rem' }}>
        <span>Not a partner yet?</span>
        <Link to="/register-restaurant" className="auth-footer-link" style={{ color: 'var(--primary)' }}>
          Register Restaurant
        </Link>
      </div>
    </AuthLayout>
  );
};

export default OwnerLogin;
