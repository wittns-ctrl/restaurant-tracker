import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const ROLE_LANDING = {
  customer: '/customer/dashboard',
  owner: '/owner/dashboard',
  admin: '/admin/dashboard',
};

const ALLOWED_ROLES = ['customer', 'owner', 'admin'];

const getStoredToken = () => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem('accessToken');
  } catch {
    return null;
  }
};

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, loading, user } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const hasStoredToken = !!getStoredToken();

  const requiredRoles = roles && roles.length > 0 ? roles : ALLOWED_ROLES;

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      showToast('Please sign in to access this page', 'info');
    } else if (!requiredRoles.includes(user?.role)) {
      const landing = ROLE_LANDING[user?.role] || '/login';
      showToast(`You don't have permission to access that page`, 'error');
    }
  }, [isAuthenticated, loading, user, requiredRoles, showToast]);

  if (loading || (!isAuthenticated && !hasStoredToken)) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f9fafb',
      }}>
        <div style={{
          color: '#6b7280',
          fontSize: 14,
        }}>Checking authentication…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!requiredRoles.includes(user?.role)) {
    const fallback = ROLE_LANDING[user?.role] || '/login';
    return <Navigate to={fallback} replace />;
  }

  return children;
}
