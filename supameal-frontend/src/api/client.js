const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const DEFAULT_TIMEOUT_MS = 30000;

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

let onTokenRefreshed = null; // hook so AuthContext can persist rotated tokens
export function setTokenRefreshListener(fn) {
  onTokenRefreshed = fn;
}

let isRefreshing = false;
let refreshPromise = null;

async function tryRefreshToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;
  if (!isRefreshing) {
    isRefreshing = true;
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) return false;
        const data = await res.json().catch(() => null);
        if (!data?.accessToken) return false;
        localStorage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        if (onTokenRefreshed) onTokenRefreshed(data);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function apiRequest(path, options = {}) {
  const { skipAuth, headers: extraHeaders, timeoutMs, ...rest } = options;
  const token = localStorage.getItem('accessToken');
  const headers = {
    'Content-Type': 'application/json',
    ...(extraHeaders || {}),
  };
  if (!skipAuth && token) headers.Authorization = `Bearer ${token}`;

  // Abort requests that hang — no more infinite spinners on dead networks
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs || DEFAULT_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { ...rest, headers, signal: controller.signal });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new ApiError('Request timed out', 0);
    }
    throw new ApiError(err.message || 'Network error', 0);
  } finally {
    clearTimeout(timeout);
  }

  // Auto-refresh on 401 once, then retry the original request
  if (res.status === 401 && !skipAuth && !path.startsWith('/auth/')) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const newToken = localStorage.getItem('accessToken');
      if (newToken) {
        headers.Authorization = `Bearer ${newToken}`;
        res = await fetch(`${API_URL}${path}`, { ...rest, headers, signal: controller.signal });
      }
    }
  }

  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    throw new ApiError(data.message || data.error || 'Request failed', res.status);
  }
  return data;
}

export { API_URL, ApiError };
