import axios, { AxiosError, AxiosRequestConfig } from 'axios';
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
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          }

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

// API methods
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const customersApi = {
  list: (params?: Record<string, unknown>) => api.get('/customers', { params }),
  get: (id: string) => api.get(`/customers/${id}`),
  create: (data: Record<string, unknown>) => api.post('/customers', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
};

export const productsApi = {
  list: (params?: Record<string, unknown>) => api.get('/products', { params }),
  get: (id: string) => api.get(`/products/${id}`),
  create: (data: Record<string, unknown>) => api.post('/products', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  getPrice: (id: string, customerId?: string, quantity?: number) =>
    api.get(`/products/${id}/price`, { params: { customerId, quantity } }),
};

export const quotesApi = {
  list: (params?: Record<string, unknown>) => api.get('/quotes', { params }),
  get: (id: string) => api.get(`/quotes/${id}`),
  create: (data: Record<string, unknown>) => api.post('/quotes', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/quotes/${id}`, data),
  send: (id: string) => api.post(`/quotes/${id}/send`),
  accept: (id: string) => api.post(`/quotes/${id}/accept`),
  reject: (id: string, reason: string) => api.post(`/quotes/${id}/reject`, { reason }),
  convert: (id: string) => api.post(`/quotes/${id}/convert`),
};

export const ordersApi = {
  list: (params?: Record<string, unknown>) => api.get('/orders', { params }),
  get: (id: string) => api.get(`/orders/${id}`),
  create: (data: Record<string, unknown>) => api.post('/orders', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/orders/${id}`, data),
  transition: (id: string, status: string) => api.post(`/orders/${id}/transition`, { status }),
};

export const scheduleApi = {
  runs: {
    list: (params?: Record<string, unknown>) => api.get('/schedule/runs', { params }),
    get: (id: string) => api.get(`/schedule/runs/${id}`),
    create: (data: Record<string, unknown>) => api.post('/schedule/runs', data),
    update: (id: string, data: Record<string, unknown>) => api.patch(`/schedule/runs/${id}`, data),
    transition: (id: string, status: string) => api.post(`/schedule/runs/${id}/transition`, { status }),
  },
  vehicles: {
    list: () => api.get('/schedule/vehicles'),
    get: (id: string) => api.get(`/schedule/vehicles/${id}`),
    create: (data: Record<string, unknown>) => api.post('/schedule/vehicles', data),
    update: (id: string, data: Record<string, unknown>) => api.patch(`/schedule/vehicles/${id}`, data),
  },
  drivers: {
    list: () => api.get('/schedule/drivers'),
    get: (id: string) => api.get(`/schedule/drivers/${id}`),
    create: (data: Record<string, unknown>) => api.post('/schedule/drivers', data),
    update: (id: string, data: Record<string, unknown>) => api.patch(`/schedule/drivers/${id}`, data),
  },
};

export const inventoryApi = {
  summary: () => api.get('/inventory/summary'),
  movements: (params?: Record<string, unknown>) => api.get('/inventory/movements', { params }),
  recordMovement: (data: Record<string, unknown>) => api.post('/inventory/movements', data),
  refillBatches: {
    list: (params?: Record<string, unknown>) => api.get('/inventory/refill-batches', { params }),
    get: (id: string) => api.get(`/inventory/refill-batches/${id}`),
    create: (data: Record<string, unknown>) => api.post('/inventory/refill-batches', data),
    transition: (id: string, status: string) => api.post(`/inventory/refill-batches/${id}/transition`, { status }),
    complete: (id: string, actualCount: number) => api.post(`/inventory/refill-batches/${id}/complete`, { actualFilledCount: actualCount }),
  },
  tanks: {
    list: () => api.get('/inventory/tanks'),
    get: (id: string) => api.get(`/inventory/tanks/${id}`),
    recordReading: (id: string, data: Record<string, unknown>) => api.post(`/inventory/tanks/${id}/readings`, data),
    recordMovement: (id: string, data: Record<string, unknown>) => api.post(`/inventory/tanks/${id}/movements`, data),
  },
};

export const checklistsApi = {
  templates: {
    list: () => api.get('/checklists/templates'),
    get: (id: string) => api.get(`/checklists/templates/${id}`),
    create: (data: Record<string, unknown>) => api.post('/checklists/templates', data),
    update: (id: string, data: Record<string, unknown>) => api.patch(`/checklists/templates/${id}`, data),
    activate: (id: string) => api.post(`/checklists/templates/${id}/activate`),
    archive: (id: string) => api.post(`/checklists/templates/${id}/archive`),
  },
  responses: {
    list: (params?: Record<string, unknown>) => api.get('/checklists/responses', { params }),
    get: (id: string) => api.get(`/checklists/responses/${id}`),
    create: (data: Record<string, unknown>) => api.post('/checklists/responses', data),
    update: (id: string, data: Record<string, unknown>) => api.patch(`/checklists/responses/${id}`, data),
  },
};

export const podApi = {
  list: (params?: Record<string, unknown>) => api.get('/pod', { params }),
  get: (id: string) => api.get(`/pod/${id}`),
  create: (data: Record<string, unknown>) => api.post('/pod', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/pod/${id}`, data),
};

export const reportsApi = {
  sales: (params: { startDate: string; endDate: string }) => api.get('/reports/sales', { params }),
  delivery: (params: { startDate: string; endDate: string }) => api.get('/reports/delivery', { params }),
  inventory: () => api.get('/reports/inventory'),
  customer: (params: { startDate: string; endDate: string }) => api.get('/reports/customer', { params }),
  compliance: () => api.get('/reports/compliance'),
};

export const usersApi = {
  list: (params?: Record<string, unknown>) => api.get('/users', { params }),
  get: (id: string) => api.get(`/users/${id}`),
  create: (data: Record<string, unknown>) => api.post('/users', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};
