import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

          return api(originalRequest);
        } catch (refreshError) {
          useAuthStore.getState().logout();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

// Driver-specific API methods
export const driverApi = {
  // Get today's runs assigned to the driver
  getMyRuns: () => api.get('/schedule/runs/my'),

  // Get run details
  getRun: (id: string) => api.get(`/schedule/runs/${id}`),

  // Update run status
  startRun: (id: string) => api.post(`/schedule/runs/${id}/start`),
  completeRun: (id: string) => api.post(`/schedule/runs/${id}/complete`),

  // Update stop status
  arriveAtStop: (runId: string, stopId: string) =>
    api.post(`/schedule/runs/${runId}/stops/${stopId}/arrive`),

  // Submit POD
  submitPod: (orderId: string, data: FormData) =>
    api.post(`/pod/${orderId}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Get order details
  getOrder: (id: string) => api.get(`/orders/${id}`),
};

// Checklist API
export const checklistApi = {
  getTemplates: (type: string) => api.get(`/checklists/templates?type=${type}`),
  getTemplate: (id: string) => api.get(`/checklists/templates/${id}`),
  startResponse: (templateId: string, entityId: string) =>
    api.post('/checklists/responses', { templateId, entityId }),
  updateResponse: (id: string, items: Record<string, unknown>[]) =>
    api.patch(`/checklists/responses/${id}`, { items }),
};

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};
