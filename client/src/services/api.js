import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  setAuthToken: (token) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  },

  login: (email, password) => api.post('/auth/login', { email, password }),
  
  register: (userData) => api.post('/auth/register', userData),
  
  getMe: () => api.get('/auth/me'),
  
  updateProfile: (userData) => api.put('/auth/profile', userData),
  
  updatePassword: (currentPassword, newPassword) => 
    api.put('/auth/password', { currentPassword, newPassword }),
  
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
};

// Athletes API
export const athletesAPI = {
  getProfile: () => api.get('/athletes/profile'),
  
  updateProfile: (athleteData) => api.put('/athletes/profile', athleteData),
  
  getAthletes: (params) => api.get('/athletes', { params }),
  
  getAthleteById: (id) => api.get(`/athletes/${id}`),
  
  getStatsSummary: () => api.get('/athletes/stats/summary'),
  
  assignCoach: (athleteId, coachId) => 
    api.put(`/athletes/${athleteId}/assign-coach`, { coachId }),
};

// Stats API
export const statsAPI = {
  addStat: (statData) => api.post('/stats', statData),
  
  getStats: (params) => api.get('/stats', { params }),
  
  getStatById: (id) => api.get(`/stats/${id}`),
  
  updateStat: (id, statData) => api.put(`/stats/${id}`, statData),
  
  deleteStat: (id) => api.delete(`/stats/${id}`),
  
  getAnalytics: (params) => api.get('/stats/analytics/performance', { params }),
};

// Goals API
export const goalsAPI = {
  createGoal: (goalData) => api.post('/goals', goalData),
  
  getGoals: (params) => api.get('/goals', { params }),
  
  getGoalById: (id) => api.get(`/goals/${id}`),
  
  updateGoal: (id, goalData) => api.put(`/goals/${id}`, goalData),
  
  updateProgress: (id, value, notes) => 
    api.put(`/goals/${id}/progress`, { value, notes }),
  
  deleteGoal: (id) => api.delete(`/goals/${id}`),
  
  addFeedback: (id, feedback, rating) => 
    api.post(`/goals/${id}/feedback`, { feedback, rating }),
  
  getAnalytics: (params) => api.get('/goals/analytics/progress', { params }),
};

// Reports API
export const reportsAPI = {
  getAthleteReport: (athleteId, params) => 
    api.get(`/reports/athlete/${athleteId}`, { params }),
  
  getTeamReport: (teamId, params) => 
    api.get(`/reports/team/${teamId}`, { params }),
  
  downloadReport: (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};

// Utility functions
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatPercentage = (value) => {
  return `${value?.toFixed(1) || 0}%`;
};

export const formatNumber = (value, decimals = 1) => {
  return value?.toFixed(decimals) || '0';
};

export default api;
