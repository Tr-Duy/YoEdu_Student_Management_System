import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

// Get base URL from environment, or use empty string to leverage Vite Dev Proxy
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Unwrap ApiResponse.data and handle errors
api.interceptors.response.use(
  (response) => {
    const res = response.data;
    // If the response follows the { success, message, data, timestamp } format
    if (res && typeof res === 'object' && 'success' in res) {
      if (res.success) {
        return res.data; // Return just the data payload
      } else {
        return Promise.reject(new Error(res.message || 'Operation failed'));
      }
    }
    return res;
  },
  (error: AxiosError) => {
    const errData = error.response?.data as any;
    const errorMessage = errData?.message || error.message || 'An error occurred';
    
    // Automatically clear tokens and redirect on 401 Unauthorized (except login)
    if (error.response?.status === 401 && !error.config?.url?.includes('/api/auth/login')) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentUser');
      
      // Prevent infinite loops if already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?expired=true';
      }
    }
    
    return Promise.reject(new Error(errorMessage));
  }
);

export const cleanParams = (params?: Record<string, any>) => {
  if (!params) return undefined;
  const cleaned: Record<string, any> = {};
  Object.keys(params).forEach((key) => {
    const val = params[key];
    if (val !== undefined && val !== null && val !== '') {
      cleaned[key] = val;
    }
  });
  return cleaned;
};

