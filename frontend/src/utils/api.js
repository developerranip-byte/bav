export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const createAuthHeaders = (token) => ({
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
  'Content-Type': 'application/json',
});

export const handleApiError = (res) => {
  if (res.status === 401) {
    localStorage.removeItem('bav_auth_token');
    window.location.href = '/login';
  }
};
