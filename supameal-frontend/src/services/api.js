import { apiRequest, API_URL, ApiError } from '../api/client';

// Re-exported for consumers that build absolute URLs (SSE stream, image srcs)
export { API_URL, ApiError };

// Auth
export const authApi = {
  signup: (data) => apiRequest('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  verifyOtp: (data) => apiRequest('/auth/verifyOtp', { method: 'POST', body: JSON.stringify(data) }),
  resendOtp: (email) => apiRequest('/auth/resend-otp', { method: 'POST', body: JSON.stringify({ email }) }),
  login: (data) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  refresh: (refreshToken) => apiRequest('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }), skipAuth: true }),
  forgot: (data) => apiRequest('/auth/forgot', { method: 'POST', body: JSON.stringify(data) }),
  reset: (data) => apiRequest('/auth/reset', { method: 'POST', body: JSON.stringify(data) }),
  logout: (data) => apiRequest('/auth/logout', { method: 'POST', body: JSON.stringify(data) }),
  // One-time code exchange for OAuth login (tokens are never in the URL)
  exchange: (code) => apiRequest('/auth/oauth/exchange', { method: 'POST', body: JSON.stringify({ code }), skipAuth: true }),
};


// Restaurants
export const restaurantsApi = {
  list: async (params = {}) => {
    const q = new URLSearchParams(params).toString();
    const res = await apiRequest(`/restaurants${q ? `?${q}` : ''}`);
    return Array.isArray(res) ? res : res?.data || [];
  },
  get: (id) => apiRequest(`/restaurants/${id}`),
  register: (data) => apiRequest('/restaurants/register', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/restaurants/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  byOwner: (ownerId) => apiRequest(`/restaurants/owner/${ownerId}`),
  approve: (id, approved) => apiRequest(`/restaurants/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ approved }) }),
  addImages: (id, images) => apiRequest(`/restaurants/${id}/images`, { method: 'POST', body: JSON.stringify({ images }) }),
  removeImage: (id, imageUrl) => apiRequest(`/restaurants/${id}/images`, { method: 'DELETE', body: JSON.stringify({ imageUrl }) }),
  setStatus: (id, status) => apiRequest(`/restaurants/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  analyticsOverview: (id) => apiRequest(`/restaurants/${id}/analytics/overview`),
  analyticsRevenue: (id, period) => apiRequest(`/restaurants/${id}/analytics/revenue?period=${period || 'week'}`),
  analyticsPeakHours: (id) => apiRequest(`/restaurants/${id}/analytics/peak-hours`),
};

// Menus
export const menusApi = {
  list: (restaurantId) => apiRequest(`/menus${restaurantId ? `?restaurantId=${restaurantId}` : ''}`),
  create: (data) => apiRequest('/menus', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/menus/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/menus/${id}`, { method: 'DELETE' }),
};

// Image uploads — multipart needs its own fetch (no JSON content-type; the
// browser sets the multipart boundary). JWT is attached manually.
export const uploadsApi = {
  upload: async (file) => {
    const token = localStorage.getItem('accessToken');
    const body = new FormData();
    body.append('file', file);
    const res = await fetch(`${API_URL}/uploads`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(data.message || 'Upload failed', res.status);
    return data; // { url, size }
  },
};

// Resolve a stored image reference to a browser-usable URL.
// '/uploads/x.jpg' → API origin; http(s) passes through; '' → null.
export function resolveImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('/uploads/')) return `${API_URL}${url}`;
  if (url.startsWith('http')) return url;
  return null;
}

// Orders
export const ordersApi = {
  create: (data) => apiRequest('/orders', { method: 'POST', body: JSON.stringify(data) }),
  list: async (params = {}) => {
    const q = new URLSearchParams(params).toString();
    const res = await apiRequest(`/orders${q ? `?${q}` : ''}`);
    return Array.isArray(res) ? res : res?.data || [];
  },
  get: (id) => apiRequest(`/orders/${id}`),
  tracking: (id) => apiRequest(`/orders/${id}/tracking`),
  // One-time short-lived ticket for the SSE live-tracking stream (EventSource
  // can't send an Authorization header, so we trade the JWT for a ticket)
  streamTicket: (id) => apiRequest(`/orders/${id}/ticket`, { method: 'POST' }),
  updateStatus: (id, status) => apiRequest(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  reorder: (id) => apiRequest(`/orders/${id}/reorder`, { method: 'POST' }),
};

// Bookings
export const bookingsApi = {
  create: (data) => apiRequest('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  list: async (params = {}) => {
    const q = new URLSearchParams(params).toString();
    const res = await apiRequest(`/bookings${q ? `?${q}` : ''}`);
    return Array.isArray(res) ? res : res?.data || [];
  },
  update: (id, data) => apiRequest(`/bookings/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  cancel: (id) => apiRequest(`/bookings/${id}`, { method: 'DELETE' }),
};

// Users
export const usersApi = {
  get: (id) => apiRequest(`/users/${id}`),
  getDashboardStats: (id) => apiRequest(`/users/${id}/dashboard-stats`),
  update: (id, data) => apiRequest(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  changePassword: (id, data) => apiRequest(`/users/${id}/password`, { method: 'PATCH', body: JSON.stringify(data) }),
  list: async (params = {}) => {
    const q = new URLSearchParams(params).toString();
    const res = await apiRequest(`/users${q ? `?${q}` : ''}`);
    return Array.isArray(res) ? res : res?.data || [];
  },
  setStatus: (id, status) => apiRequest(`/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  favorites: (id) => apiRequest(`/users/${id}/favorites`),
  addFavorite: (id, restaurantId) => apiRequest(`/users/${id}/favorites/${restaurantId}`, { method: 'POST' }),
  removeFavorite: (id, restaurantId) => apiRequest(`/users/${id}/favorites/${restaurantId}`, { method: 'DELETE' }),
};

// Reviews
export const reviewsApi = {
  list: (restaurantId) => apiRequest(`/reviews${restaurantId ? `?restaurantId=${restaurantId}` : ''}`),
  create: (data) => apiRequest('/reviews', { method: 'POST', body: JSON.stringify(data) }),
};

// Notifications
export const notificationsApi = {
  list: async (userId) => {
    const res = await apiRequest(`/notifications${userId ? `?userId=${userId}` : ''}`);
    return Array.isArray(res) ? res : res?.data || [];
  },
  markRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => apiRequest('/notifications/read-all', { method: 'PATCH' }),
  dismiss: (id) => apiRequest(`/notifications/${id}`, { method: 'DELETE' }),
};

// Admin
export const adminApi = {
  overview: () => apiRequest('/admin/analytics/overview'),
  revenue: (period) => apiRequest(`/admin/analytics/revenue?period=${period || 'month'}`),
  settings: () => apiRequest('/admin/settings'),
  updateSettings: (data) => apiRequest('/admin/settings', { method: 'PATCH', body: JSON.stringify(data) }),
  maintenance: (action) => apiRequest(`/admin/maintenance/${action}`, { method: 'POST' }),
};

// Promos & Mail
export const promosApi = {
  validate: (code, subtotal) =>
    apiRequest('/promos/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal: Number(subtotal) || 0 }),
    }),
};

// Payments
export const paymentsApi = {
  createIntent: (orderId, metadata) =>
    apiRequest('/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({ orderId, metadata }),
    }),
  confirm: (paymentIntentId) =>
    apiRequest('/payments/confirm', {
      method: 'POST',
      body: JSON.stringify({ paymentIntentId }),
    }),
};

export const mailApi = {
  contact: (data) => apiRequest('/mail/contact', { method: 'POST', body: JSON.stringify(data) }),
};

// NOTE: pagination — list endpoints now return { data, pagination }.
// Use the helpers below to read them defensively.
export const unwrapList = (res) => (Array.isArray(res) ? res : res?.data || []);
