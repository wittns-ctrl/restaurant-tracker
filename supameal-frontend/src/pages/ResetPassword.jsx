import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import AuthLayout from "../layouts/AuthLayout";
import { authApi } from "../services/api";
import img1 from "../assets/images/restaurant_interior.png";
import "./auth.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new reset link.');
    }
  }, [token]);

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    const levels = [
      { level: 0, label: '', color: '' },
      { level: 1, label: 'Weak', color: '#ef4444' },
      { level: 2, label: 'Fair', color: '#f97316' },
      { level: 3, label: 'Good', color: '#eab308' },
      { level: 4, label: 'Strong', color: '#22c55e' },
    ];
    return levels[score];
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authApi.reset({ token, newPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      image={img1}
      title="Create New Password"
      subtitle="Make it strong and memorable"
    >
      <div className="auth-form-wrapper">
        <div className="auth-form-header">
          <h2 className="auth-title">Reset Password</h2>
          <p className="auth-subtitle">Enter your new password below</p>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              className="auth-success-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="success-icon-ring">
                <CheckCircle size={40} />
              </div>
              <h3>Password Reset!</h3>
              <p>Your password has been updated successfully.</p>
              <p className="success-hint">Redirecting you to login in a moment...</p>
              <Link to="/login" className="auth-submit-btn" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', marginTop: '1rem' }}>
                Go to Login
              </Link>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <AnimatePresence>
                {error && (
                  <motion.div
                    className="auth-error"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <AlertCircle size={16} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="input-group">
                  <label className="input-label">New Password</label>
                  <div className="input-wrapper">
                    <Lock size={18} className="input-icon-left" />
                    <input
                      type={showNew ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="auth-input"
                      id="reset-new-password"
                    />
                    <button
                      type="button"
                      className="eye-toggle"
                      onClick={() => setShowNew(!showNew)}
                      tabIndex={-1}
                    >
                      {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="password-strength">
                      <div className="strength-bars">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="strength-bar"
                            style={{ backgroundColor: i <= strength.level ? strength.color : 'rgba(255,255,255,0.1)' }}
                          />
                        ))}
                      </div>
                      {strength.label && (
                        <span className="strength-label" style={{ color: strength.color }}>
                          {strength.label}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="input-group">
                  <label className="input-label">Confirm Password</label>
                  <div className="input-wrapper">
                    <Lock size={18} className="input-icon-left" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="auth-input"
                      id="reset-confirm-password"
                      style={{
                        borderColor: confirmPassword
                          ? confirmPassword === newPassword
                            ? 'rgba(34,197,94,0.6)'
                            : 'rgba(239,68,68,0.6)'
                          : undefined
                      }}
                    />
                    <button
                      type="button"
                      className="eye-toggle"
                      onClick={() => setShowConfirm(!showConfirm)}
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <motion.button
                  type="submit"
                  className="auth-submit-btn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={loading || !token}
                  id="reset-submit"
                >
                  {loading ? (
                    <span className="btn-loading">
                      <span className="spinner" />
                      Resetting Password...
                    </span>
                  ) : 'Reset Password'}
                </motion.button>

                <Link to="/login" className="auth-back-link">
                  Back to Sign In
                </Link>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthLayout>
  );
}
