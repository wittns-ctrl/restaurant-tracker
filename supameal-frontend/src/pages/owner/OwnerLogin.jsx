import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Store, Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';
import AuthLayout from '../../layouts/AuthLayout';
import Button from '../../components/Button/Button';
import Loader from '../../components/Loader/Loader';
import { useAuth } from '../../context/AuthContext';
import '../auth/AuthForm.css';

const OwnerLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { loginWithCredentials, loginWithGoogle, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const oauthError = searchParams.get('error');
  const returnTo = searchParams.get('returnTo');

  useEffect(() => {
    if (oauthError) sessionStorage.removeItem('ownerOAuthIntent');
  }, [oauthError]);

  const handleGoogleLogin = () => {
    if (returnTo === '/register-restaurant') {
      sessionStorage.setItem('oauthReturnTo', '/register-restaurant');
    } else {
      sessionStorage.removeItem('oauthReturnTo');
    }
    sessionStorage.setItem('ownerOAuthIntent', 'login');
    loginWithGoogle({ role: 'owner' });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    sessionStorage.removeItem('ownerOAuthIntent');
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setIsLoading(true);
    try {
      const user = await loginWithCredentials(email.trim(), password);
      // This portal is owner-only — an admin/customer who logs in here must
      // not keep an authenticated session pointed at the owner dashboard.
      if (user?.role !== 'owner') {
        await logout();
        setError('This account is not a restaurant owner account.');
        setIsLoading(false);
        return;
      }
      navigate(returnTo === '/register-restaurant' ? returnTo : '/owner/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
      setIsLoading(false);
    }
  };

  if (isLoading) return <Loader text="Opening owner dashboard..." />;

  return (
    <AuthLayout
      className="auth-layout--owner-login"
      title="Owner Portal"
      subtitle="Manage your restaurant, orders, and reservations."
    >
      <div className="auth-form-header">
        <Store size={32} className="auth-form-icon" />
        <h3>Partner Login</h3>
        <p>Access your restaurant dashboard</p>
      </div>

      {(error || oauthError) && <p role="alert" className="auth-form-error">{error || oauthError}</p>}

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
              type={showPassword ? 'text' : 'password'}
              className="auth-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="auth-input-action"
              onClick={() => setShowPassword(value => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
        </div>
        <Button variant="primary" className="auth-submit-btn" type="submit">
          <LogIn size={18} style={{ marginRight: 8 }} />
          Sign In
        </Button>
      </form>

      <div className="auth-form-divider"><span>OR</span></div>
      <button type="button" className="auth-social-btn" onClick={handleGoogleLogin}>
        <FaGoogle /> Continue with Google
      </button>

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
