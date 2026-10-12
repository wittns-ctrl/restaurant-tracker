import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';
import Loader from '../../components/Loader/Loader';

// React StrictMode replays effects in development. Since OAuth codes are
// one-time use, keep a single exchange promise per code so the replay shares
// the original request instead of consuming the code twice.
const codeExchanges = new Map();

function exchangeCodeOnce(code) {
  if (!codeExchanges.has(code)) {
    const request = authApi.exchange(code);
    codeExchanges.set(code, request);
    // OAuth codes expire quickly; bound this cache if a callback is abandoned.
    setTimeout(() => codeExchanges.delete(code), 60_000);
  }
  return codeExchanges.get(code);
}

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
        const res = await exchangeCodeOnce(code);
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
