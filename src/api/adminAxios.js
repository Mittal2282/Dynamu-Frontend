import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const adminApi = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach admin JWT to every request
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 — try to refresh; on failure, redirect to login
adminApi.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('admin_refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken });
          const newToken = data.data.accessToken;
          localStorage.setItem('admin_access_token', newToken);
          original.headers.Authorization = `Bearer ${newToken}`;
          return adminApi(original);
        } catch {
          // Refresh failed — clear storage and redirect
        }
      }
      localStorage.removeItem('admin_access_token');
      localStorage.removeItem('admin_refresh_token');
      localStorage.removeItem('admin_role');
      localStorage.removeItem('admin_name');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default adminApi;
