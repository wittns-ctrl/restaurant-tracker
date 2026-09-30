import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { authApi } from '../services/api';
import { setTokenRefreshListener } from '../api/client';

const AuthContext = createContext(null);

const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes — refresh halfway through a 15-min token

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimer = useRef(null);

  const clearRefreshTimer = () => {
    if (refreshTimer.current) {
      clearInterval(refreshTimer.current);
      refreshTimer.current = null;
    }
  };

  const persistAuth = useCallback((authUser, accessToken, refreshToken) => {
    setUser(authUser);
    localStorage.setItem('user', JSON.stringify(authUser));
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  }, []);

  const forceLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    clearRefreshTimer();
  }, []);

  const refreshToken = useCallback(async () => {
    const stored = localStorage.getItem('refreshToken');
    if (!stored) return false;
    try {
      const res = await authApi.refresh(stored);
      persistAuth(res.user, res.accessToken, res.refreshToken);
      return true;
    } catch (err) {
      forceLogout();
      return false;
    }
  }, [persistAuth, forceLogout]);

  // The api client auto-refreshes on 401 — persist rotated tokens here too
  useEffect(() => {
    setTokenRefreshListener((data) => {
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    });
    return () => setTokenRefreshListener(null);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const access = localStorage.getItem('accessToken');
    const refresh = localStorage.getItem('refreshToken');

    const init = async () => {
      if (stored && access) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          forceLogout();
        }
      } else if (refresh) {
        await refreshToken();
      }
      setLoading(false);
    };
    init();
  }, [refreshToken, forceLogout]);

  useEffect(() => {
    clearRefreshTimer();
    if (user && localStorage.getItem('refreshToken')) {
      refreshTimer.current = setInterval(refreshToken, REFRESH_INTERVAL_MS);
    }
    return clearRefreshTimer;
  }, [user, refreshToken]);

  const loginWithCredentials = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password });
    persistAuth(res.user, res.accessToken, res.refreshToken);
    return res.user;
  }, [persistAuth]);

  const login = useCallback(async (email, password) => {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    return loginWithCredentials(email, password);
  }, [loginWithCredentials]);

  const signup = useCallback(async (data) => {
    return authApi.signup(data);
  }, []);

  const verifyOtp = useCallback(async (email, otp) => {
    const res = await authApi.verifyOtp({ email, otp });
    if (res.user && res.accessToken) {
      persistAuth(res.user, res.accessToken, res.refreshToken);
    }
    return res;
  }, [persistAuth]);

  const resendOtp = useCallback(async (email) => {
    return authApi.resendOtp(email);
  }, []);

  const forgotPassword = useCallback(async (email) => {
    return authApi.forgot({ email });
  }, []);

  const resetPassword = useCallback(async (token, newPassword) => {
    return authApi.reset({ token, newPassword });
  }, []);

  const getApiBaseUrl = useCallback(() => {
    return (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
  }, []);

  const loginWithGoogle = useCallback(() => {
    window.location.href = `${getApiBaseUrl()}/auth/google`;
  }, [getApiBaseUrl]);

  const loginWithApple = useCallback(() => {
    window.location.href = `${getApiBaseUrl()}/auth/apple`;
  }, [getApiBaseUrl]);

  const logout = useCallback(async () => {
    const email = user?.email;
    try {
      if (email) await authApi.logout({ email });
    } catch {
      // ignore logout API errors
    }
    forceLogout();
  }, [user, forceLogout]);

  const updateUser = useCallback((updatedUserData) => {
    setUser((prev) => {
      const newUser = { ...prev, ...updatedUserData };
      localStorage.setItem('user', JSON.stringify(newUser));
      return newUser;
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      updateUser,
      login,
      loginWithCredentials,
      loginWithGoogle,
      loginWithApple,
      persistAuth,
      logout,
      signup,
      verifyOtp,
      resendOtp,
      forgotPassword,
      resetPassword,
      refreshToken,
      loading,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
