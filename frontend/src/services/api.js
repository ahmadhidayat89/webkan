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

// ─── Accreditation Steps (Public) ────────────────────────────────────────────
export const getAccreditationSteps = () =>
  api.get('/accreditation-steps');

// ─── Accreditation Steps (Admin) ─────────────────────────────────────────────
export const getAdminAccreditationSteps = () =>
  api.get('/admin/accreditation-steps');

export const createAccreditationStep = (data) =>
  api.post('/admin/accreditation-steps', data);

export const updateAccreditationStep = (id, data) =>
  api.put(`/admin/accreditation-steps/${id}`, data);

export const deleteAccreditationStep = (id) =>
  api.delete(`/admin/accreditation-steps/${id}`);

export const moveAccreditationStepUp = (id) =>
  api.post(`/admin/accreditation-steps/${id}/move-up`);

export const moveAccreditationStepDown = (id) =>
  api.post(`/admin/accreditation-steps/${id}/move-down`);

// ─── Surveys (Admin) ──────────────────────────────────────────────────────────
export const getAdminSurveys = () =>
  api.get('/admin/surveys');

export const getAdminSurvey = (id) =>
  api.get(`/admin/surveys/${id}`);

export const createAdminSurvey = (data) =>
  api.post('/admin/surveys', data);

export const uploadSurveyImage = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return api.post('/admin/surveys/upload-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};

export const updateAdminSurvey = (id, data) =>
  api.put(`/admin/surveys/${id}`, data);

export const deleteAdminSurvey = (id) =>
  api.delete(`/admin/surveys/${id}`);

export const publishAdminSurvey = (id) =>
  api.post(`/admin/surveys/${id}/publish`);

export const toggleActiveAdminSurvey = (id) =>
  api.post(`/admin/surveys/${id}/toggle-active`);

export const exportAdminSurveyCsv = (id) =>
  api.get(`/admin/surveys/${id}/export-csv`, { responseType: 'blob' });

// ─── Surveys (Public) ─────────────────────────────────────────────────────────
export const getPublicSurvey = (code, editToken) =>
  api.get(`/surveys/${code}`, { params: editToken ? { edit: editToken } : {} });

export const gradeSurveyResponse = (id, responseId, data) => api.patch(`/admin/surveys/${id}/responses/${responseId}/grade`, data);

export const submitPublicSurvey = (code, data) =>
  api.post(`/surveys/${code}/submit`, data);

export const uploadPublicSurveyFile = (code, questionId, file) => {
  const formData = new FormData();
  formData.append('question_id', questionId);
  formData.append('file', file);
  return api.post(`/surveys/${code}/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};

export default api;
