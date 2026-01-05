import axios from 'axios';

// Get backend URL from environment or use default
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('kotaToken');
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
  (response) => {
    return response;
  },
  (error) => {
    // Handle network errors (offline)
    if (!navigator.onLine || error.message === 'Network Error') {
      console.log('Network error - user might be offline');
      // Don't redirect on network errors
      return Promise.reject({
        ...error,
        isOffline: true,
        message: 'You appear to be offline. Changes will sync when you reconnect.'
      });
    }
    
    // Handle auth errors
    if (error.response?.status === 401) {
      localStorage.removeItem('kotaToken');
      localStorage.removeItem('kotaUser');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export { api };
