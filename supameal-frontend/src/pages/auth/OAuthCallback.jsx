import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';
import Loader from '../../components/Loader/Loader';

const DASHBOARD_ROUTES = {
  customer: '/customer/dashboard',
  owner: '/owner/dashboard',
  restaurant_owner: '/owner/dashboard',
  admin: '/admin/dashboard',
};

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { persistAuth } = useAuth();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      navigate(`/login?error=${encodeURIComponent(error)}`, { replace: true });
      return;
    }

    if (!code) {
      navigate('/login?error=OAuth+failed', { replace: true });
      return;
    }

    let cancelled = false;

    const exchange = async () => {
      try {
        // Exchange the one-time code for tokens — tokens never touch the URL
        const res = await authApi.exchange(code);
        if (cancelled) return;
        persistAuth(res.user, res.accessToken, res.refreshToken);
        const roleKey = res.user?.role === 'owner' ? 'restaurant_owner' : res.user?.role;
        navigate(DASHBOARD_ROUTES[roleKey] || DASHBOARD_ROUTES.customer, { replace: true });
      } catch {
        if (cancelled) return;
        navigate('/login?error=Invalid+or+expired+OAuth+code', { replace: true });
      }
    };
    exchange();

    return () => {
      cancelled = true;
    };
  }, [searchParams, navigate, persistAuth]);

  return <Loader text="Completing sign-in..." />;
}
