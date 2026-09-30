import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, ShieldCheck, UtensilsCrossed, Store, LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';
import AuthLayout from '../../layouts/AuthLayout';
import Button from '../../components/Button/Button';
import Loader from '../../components/Loader/Loader';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';
import './AuthForm.css';

const DASHBOARD_ROUTES = {
  customer: '/customer/dashboard',
  restaurant_owner: '/owner/dashboard',
  admin: '/admin/dashboard',
};

const ROLE_LABELS = {
  customer: { label: 'Customer', icon: UtensilsCrossed },
  restaurant_owner: { label: 'Restaurant Owner', icon: Store },
  admin: { label: 'Admin', icon: ShieldCheck },
};

const Login = () => {
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { loginWithCredentials, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError) {
      setError(decodeURIComponent(oauthError.replace(/\+/g, ' ')));
    }
  }, [searchParams]);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setForgotMessage('');
    if (!email.trim()) {
      setError('Please enter your email to reset your password.');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.forgot({ email: email.trim() });
      setForgotMessage(res.message || 'Reset link sent to your email. Check your inbox.');
    } catch (err) {
      setError(err.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password to sign in.');
      return;
    }
    setLoading(true);
    try {
      const user = await loginWithCredentials(email.trim(), password);
      const loggedInRole = user?.role === 'owner' ? 'restaurant_owner' : user?.role || role;
      navigate(DASHBOARD_ROUTES[loggedInRole] || DASHBOARD_ROUTES[role], { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader text="Signing you in..." />;

  return (
    <AuthLayout
      title={isForgotPassword ? "Reset Your Password" : "Welcome back to SupaMeal"}
      subtitle={isForgotPassword ? "We'll send you a secure reset link." : "Sign in to access your dashboard."}
    >
      <div className="auth-form-header">
        <LogIn size={32} className="auth-form-icon" style={{ color: 'var(--primary)' }} />
        <h3>{isForgotPassword ? "Forgot Password" : "Sign In"}</h3>
        <p>{isForgotPassword ? "Enter your email to receive a reset link" : "Select your account type to continue"}</p>
      </div>

      {error && <p className="auth-form-error">{error}</p>}
      {forgotMessage && <p className="auth-form-success" style={{ color: 'green', fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'center' }}>{forgotMessage}</p>}

      {isForgotPassword ? (
        <form onSubmit={handleForgotPassword}>
          <div className="auth-input-group">
            <label>Email Address</label>
            <div className="auth-input-wrapper">
              <Mail size={18} className="auth-input-icon" />
              <input
                type="email"
                placeholder="you@example.com"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>
          <Button variant="primary" className="auth-submit-btn" type="submit" disabled={loading}>
            Send Reset Link
          </Button>
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button type="button" onClick={() => { setIsForgotPassword(false); setError(''); setForgotMessage(''); }} className="auth-forgot-link" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>
              Back to Sign In
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSignIn}>
          <div className="auth-input-group">
            <label>Email</label>
            <div className="auth-input-wrapper">
              <Mail size={18} className="auth-input-icon" />
              <input
                type="email"
                placeholder="you@example.com"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label>Password</label>
            <button type="button" onClick={() => { setIsForgotPassword(true); setError(''); }} className="auth-forgot-link" style={{ background: 'none', border: 'none', cursor: 'pointer', float: 'right' }}>
              Forgot password?
            </button>
            <div className="auth-input-wrapper">
              <Lock size={18} className="auth-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-input-action"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          <div className="auth-input-group">
            <label>I am a...</label>
            <div className="role-selector" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {Object.entries(ROLE_LABELS).map(([r, { label, icon: Icon }]) => (
                <button
                  type="button"
                  key={r}
                  className={`role-btn ${role === r ? 'active' : ''}`}
                  onClick={() => setRole(r)}
                  style={{
                    padding: '0.75rem 0.5rem',
                    fontSize: '0.78rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    height: '80px',
                  }}
                >
                  <Icon size={20} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Button variant="primary" className="auth-submit-btn" type="submit" disabled={loading}>
            <LogIn size={18} style={{ marginRight: '8px' }} />
            Sign In as {ROLE_LABELS[role].label}
          </Button>
        </form>
      )}

      <div className="auth-form-divider">
        <span>OR</span>
      </div>

      <button type="button" className="auth-social-btn" onClick={loginWithGoogle}>
        <FaGoogle /> Continue with Google
      </button>

      <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>Or explore public pages:</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/restaurants" className="auth-footer-link" style={{ fontSize: '0.85rem' }}>Restaurants</Link>
          <span style={{ color: 'var(--text-muted)' }}>·</span>
          <Link to="/book-table" className="auth-footer-link" style={{ fontSize: '0.85rem' }}>Book a Table</Link>
          <span style={{ color: 'var(--text-muted)' }}>·</span>
          <Link to="/register-restaurant" className="auth-footer-link" style={{ fontSize: '0.85rem' }}>Register Restaurant</Link>
        </div>
      </div>

      <div className="auth-footer" style={{ justifyContent: 'center', marginTop: '1.5rem' }}>
        <span>New to SupaMeal?</span>
        <Link to="/signup" className="auth-footer-link">
          Create an account <ChevronRight size={16} />
        </Link>
      </div>
    </AuthLayout>
  );
};

export default Login;
