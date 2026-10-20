import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fixaround_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 & format response
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't loop redirect if already on login page
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('fixaround_token');
        localStorage.removeItem('fixaround_user');
        window.location.href = '/login?expired=1';
      }
    }
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject({
      message,
      status: error.response?.status,
      errors: error.response?.data?.errors,
      raw: error,
    });
  }
);

// Auth API
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (credentials) => api.post('/auth/login', credentials),
  googleLogin: (data) => api.post('/auth/google', data),
  getMe: () => api.get('/auth/me'),
  logout: () => {
    localStorage.removeItem('fixaround_token');
    localStorage.removeItem('fixaround_user');
    return Promise.resolve({ success: true });
  },
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Services Categories API
export const servicesApi = {
  getAll: (params) => api.get('/services', { params }),
  getById: (id) => api.get(`/services/${id}`),
  getBySlug: (slug) => api.get(`/services/slug/${slug}`),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  updateStatus: (id, isActive) => api.patch(`/services/${id}/status`, { is_active: isActive }),
  delete: (id) => api.delete(`/services/${id}`),
};

// Technicians API
export const techniciansApi = {
  getAll: (params) => api.get('/technicians', { params }),
  getById: (id) => api.get(`/technicians/${id}`),
  getNearby: (params) => api.get('/technicians/nearby', { params }),
  updateProfile: (data) => api.put('/technicians/profile', data),
  setAvailability: (data) => api.post('/technicians/availability', data),
  updateLocation: (coords) => api.post('/technicians/location', coords),
  verify: (id, statusData) => api.post(`/technicians/${id}/verify`, statusData),
  getReviews: (id, params) => api.get(`/technicians/${id}/reviews`, { params }),
  getSkills: (id) => api.get(`/technicians/${id}/skills`),
  updateSkills: (skills) => api.put('/technicians/skills', { skills }),
  uploadDocument: (data) => api.post('/technicians/documents', data),
  getDocuments: () => api.get('/technicians/documents'),
};

// Bookings API
export const bookingsApi = {
  create: (data) => api.post('/bookings', data),
  getAll: (params) => api.get('/bookings', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  cancel: (id, reason) => api.post(`/bookings/${id}/cancel`, { reason }),
  updateStatus: (id, status, notes = '') => api.patch(`/bookings/${id}/status`, { status, notes }),
  accept: (id) => api.post(`/bookings/${id}/accept`),
  reject: (id, reason) => api.post(`/bookings/${id}/reject`, { reason }),
  getTimeline: (id) => api.get(`/bookings/${id}/timeline`),
  getIncomingRequests: () => api.get('/bookings/incoming'),
  getMyBookings: (params) => api.get('/bookings/my-bookings', { params }),
  assignTechnician: (id, technicianId) => api.post(`/bookings/${id}/assign`, { technician_id: technicianId }),
};

// Estimates API
export const estimatesApi = {
  create: (data) => api.post('/estimates', data),
  getByBooking: (bookingId) => api.get(`/estimates/booking/${bookingId}`),
  getById: (id) => api.get(`/estimates/${id}`),
  approve: (id) => api.post(`/estimates/${id}/approve`),
  reject: (id, reason) => api.post(`/estimates/${id}/reject`, { reason }),
};

// Payments API
export const paymentsApi = {
  initiate: (data) => api.post('/payments/initiate', data),
  verify: (data) => api.post('/payments/verify', data),
  getByBooking: (bookingId) => api.get(`/payments/booking/${bookingId}`),
  getMyPayments: (params) => api.get('/payments/my-payments', { params }),
  webhook: (data) => api.post('/payments/webhook', data),
  simulateSandbox: (data) => api.post('/payments/sandbox-pay', data),
};

// Invoices API
export const invoicesApi = {
  getById: (id) => api.get(`/invoices/${id}`),
  getMyInvoices: (params) => api.get('/invoices/my-invoices', { params }),
  getByBooking: (bookingId) => api.get(`/invoices/booking/${bookingId}`),
};

// Reviews API
export const reviewsApi = {
  create: (data) => api.post('/reviews', data),
  getByTechnician: (technicianId, params) => api.get(`/reviews/technician/${technicianId}`, { params }),
  getMyReviews: (params) => api.get('/reviews/my-reviews', { params }),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
};

// Warranty Claims API
export const claimsApi = {
  create: (data) => api.post('/claims', data),
  getMyClaims: (params) => api.get('/claims/my-claims', { params }),
  getAll: (params) => api.get('/claims', { params }),
  getById: (id) => api.get(`/claims/${id}`),
  resolve: (id, data) => api.post(`/claims/${id}/resolve`, data),
  respond: (id, data) => api.post(`/claims/${id}/respond`, data),
};

// Notifications API
export const notificationsApi = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/mark-all-read'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

// Earnings API
export const earningsApi = {
  getMyEarnings: (params) => api.get('/technicians/earnings', { params }),
  getSummary: () => api.get('/technicians/earnings/summary'),
};

// Admin API
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUserStatus: (id, isActive) => api.patch(`/admin/users/${id}/status`, { is_active: isActive }),
  getBookings: (params) => api.get('/admin/bookings', { params }),
  getEmergencyBookings: (params) => api.get('/admin/bookings/emergency', { params }),
  getPayments: (params) => api.get('/admin/payments', { params }),
  getSettings: () => api.get('/admin/settings'),
  updateSetting: (key, value) => api.put(`/admin/settings/${key}`, { value }),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  reassignBooking: (bookingId, technicianId) => api.post(`/admin/bookings/${bookingId}/reassign`, { technician_id: technicianId }),
  getTechniciansForVerification: (params) => api.get('/admin/technicians/verification', { params }),
  getClaims: (params) => api.get('/admin/claims', { params }),
  getReviews: (params) => api.get('/admin/reviews', { params }),
  toggleReviewVisibility: (id, isVisible) => api.patch(`/admin/reviews/${id}/visibility`, { is_visible: isVisible }),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`),
};

// Customer Addresses API
export const addressesApi = {
  getAll: () => api.get('/customers/addresses'),
  create: (data) => api.post('/customers/addresses', data),
  update: (id, data) => api.put(`/customers/addresses/${id}`, data),
  delete: (id) => api.delete(`/customers/addresses/${id}`),
  setDefault: (id) => api.patch(`/customers/addresses/${id}/default`),
};

export default api;
