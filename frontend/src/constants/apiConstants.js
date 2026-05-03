// Centralized API URL constants. All endpoints reference this file.

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN:   `${API_BASE_URL}/auth/login`,
    PROFILE: `${API_BASE_URL}/auth/profile`,
  },
  LEADS: {
    BASE:      `${API_BASE_URL}/leads`,
    BY_ID: (id) => `${API_BASE_URL}/leads/${id}`,
  },
  PRODUCTS: {
    BASE:      `${API_BASE_URL}/products`,
    BY_ID: (id) => `${API_BASE_URL}/products/${id}`,
  },
  PROJECTS: {
    BASE:         `${API_BASE_URL}/projects`,
    BY_ID: (id)   => `${API_BASE_URL}/projects/${id}`,
    APPROVE: (id) => `${API_BASE_URL}/projects/${id}/approve`,
  },
  CUSTOMERS: {
    BASE:      `${API_BASE_URL}/customers`,
    BY_ID: (id) => `${API_BASE_URL}/customers/${id}`,
  },
  REPORTS: {
    SUMMARY: `${API_BASE_URL}/reports/summary`,
    EXPORT:  `${API_BASE_URL}/reports/export`,
  },
};
