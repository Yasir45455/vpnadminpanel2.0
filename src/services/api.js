import axios from 'axios';

const API_BASE_URL = 'https://vpnsbackend.oxmite.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vpnAdminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('vpnAdminToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Admin Auth APIs
export const adminAuthAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/admin/login', { email, password });
    return response.data;
  },
};

// User Management APIs
export const userAPI = {
  getAllUsers: async (appName) => {
    const params = appName ? { app_name: appName } : {};
    const response = await api.get('/admin/users', { params });
    return response.data;
  },
  updateUserStatus: async (userId, status) => {
    const response = await api.patch(`/admin/users/${userId}/status`, { status });
    return response.data;
  },
  createUserUsageLimit: async (userId, usageLimit) => {
    const response = await api.post(`/admin/users/${userId}/usage-limit`, { usageLimit });
    return response.data;
  },
  getUserUsageLimit: async (userId) => {
    const response = await api.get(`/admin/users/${userId}/usage-limit`);
    return response.data;
  },
  updateUserUsageLimit: async (userId, usageLimit) => {
    const response = await api.put(`/admin/users/${userId}/usage-limit`, { usageLimit });
    return response.data;
  },
  updateUserUsageLimitPatch: async (userId, usageLimit) => {
    const response = await api.patch(`/admin/users/${userId}/usage-limit`, { usageLimit });
    return response.data;
  },
};

// VPN Usage APIs
export const vpnAPI = {
  getAllUsersUsage: async (appName) => {
    const params = appName ? { app_name: appName } : {};
    const response = await api.get('/admin/vpn-usage', { params });
    return response.data;
  },
  getUserUsage: async (userId) => {
    const response = await api.get(`/admin/vpn-usage/${userId}`);
    return response.data;
  },
};

// External App Backend Registry APIs
export const appBackendAPI = {
  getAll: async () => {
    const response = await api.get('/admin/app-backends');
    return response.data;
  },
  create: async (payload) => {
    const response = await api.post('/admin/app-backends', payload);
    return response.data;
  },
  update: async (appName, payload) => {
    const response = await api.put(`/admin/app-backends/${appName}`, payload);
    return response.data;
  },
  remove: async (appName) => {
    const response = await api.delete(`/admin/app-backends/${appName}`);
    return response.data;
  },
  test: async (appName) => {
    const response = await api.post(`/admin/app-backends/${appName}/test`);
    return response.data;
  },
};

export default api;
