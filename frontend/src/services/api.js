import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// Public API calls
export const getHomeData = (lang = 'id') => {
  return api.get(`/home?lang=${lang}`);
};

export const getSettings = (lang = 'id', group = null) => {
  const params = { lang };
  if (group) params.group = group;
  return api.get('/settings', { params });
};

// Auth API calls
export const login = (credentials) => {
  return api.post('/login', credentials);
};

export const logout = () => {
  return api.post('/admin/logout');
};

export const getMe = () => {
  return api.get('/admin/me');
};

// Admin API calls
export const getSliders = () => {
  return api.get('/admin/sliders');
};

export const createSlider = (data) => {
  return api.post('/admin/sliders', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const updateSlider = (id, data) => {
  return api.post(`/admin/sliders/${id}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const deleteSlider = (id) => {
  return api.delete(`/admin/sliders/${id}`);
};

export const reorderSliders = (sliders) => {
  return api.post('/admin/sliders/reorder', { sliders });
};

export default api;