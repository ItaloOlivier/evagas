import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Get token from localStorage
const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }
  return null;
};

const getRefreshToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refreshToken');
  }
  return null;
};

const setTokens = (accessToken: string, refreshToken: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }
};

const clearTokens = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
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

      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
            refreshToken,
          });

          setTokens(data.accessToken, data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

          return api(originalRequest);
        } catch (refreshError) {
          clearTokens();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    setTokens(data.accessToken, data.refreshToken);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },
  logout: () => {
    clearTokens();
    window.location.href = '/login';
  },
  me: () => api.get('/auth/me'),
  getUser: () => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  },
};

// Schedule/Loading API
export const scheduleApi = {
  getRuns: (params?: { status?: string; date?: string }) =>
    api.get('/schedule/runs', { params }),
  getRun: (id: string) => api.get(`/schedule/runs/${id}`),
  updateRunStatus: (id: string, status: string) =>
    api.patch(`/schedule/runs/${id}/status`, { status }),
  completeLoading: (id: string, loadedQuantities: Record<string, number>) =>
    api.post(`/schedule/runs/${id}/complete-loading`, { loadedQuantities }),
};

// Inventory API - Cylinder Stock
export const inventoryApi = {
  // Stock summary
  getStockSummary: () => api.get('/inventory/cylinders/stock'),
  getStockBySize: (size: string) => api.get(`/inventory/cylinders/stock/${size}`),
  getStockByStatus: (status: string) => api.get(`/inventory/cylinders/stock/status/${status}`),
  getLowStockAlerts: () => api.get('/inventory/cylinders/alerts'),

  // Movements
  getMovements: (params?: Record<string, unknown>) =>
    api.get('/inventory/cylinders/movements', { params }),
  createMovement: (data: {
    cylinderSize: string;
    movementType: string;
    quantity: number;
    reason?: string;
    notes?: string;
  }) => api.post('/inventory/cylinders/movements', data),

  // Adjustments
  createAdjustment: (data: {
    cylinderSize: string;
    status: string;
    adjustment: number;
    reason: string;
    notes?: string;
  }) => api.post('/inventory/cylinders/adjustments', data),

  // Refill batches
  getRefillBatches: (params?: { status?: string; cylinderSize?: string }) =>
    api.get('/inventory/refill-batches', { params }),
  getRefillBatch: (id: string) => api.get(`/inventory/refill-batches/${id}`),
  createRefillBatch: (data: { cylinderSize: string; quantity: number; notes?: string }) =>
    api.post('/inventory/refill-batches', data),
  startInspection: (id: string, preFillChecklistId?: string) =>
    api.post(`/inventory/refill-batches/${id}/start-inspection`, { preFillChecklistId }),
  completeInspection: (id: string, data: { passedCount: number; failedCount: number; notes?: string }) =>
    api.post(`/inventory/refill-batches/${id}/complete-inspection`, data),
  startFilling: (id: string, fillStationId?: string) =>
    api.post(`/inventory/refill-batches/${id}/start-filling`, { fillStationId }),
  completeFilling: (id: string) =>
    api.post(`/inventory/refill-batches/${id}/complete-filling`, {}),
  completeQC: (id: string, data: { passedCount: number; failedCount: number; qcChecklistId?: string }) =>
    api.post(`/inventory/refill-batches/${id}/complete-qc`, data),
  stockBatch: (id: string) =>
    api.post(`/inventory/refill-batches/${id}/stock`, {}),

  // Tanks (bulk storage)
  getTanks: () => api.get('/inventory/tanks'),
  getTank: (id: string) => api.get(`/inventory/tanks/${id}`),
  recordTankReading: (data: { tankId: string; levelLitres: number; temperatureCelsius?: number; pressureKpa?: number; notes?: string }) =>
    api.post('/inventory/tanks/readings', data),

  // Daily counts
  getDailyCounts: (params?: { fromDate?: string; toDate?: string; hasVariance?: boolean }) =>
    api.get('/inventory/daily-counts', { params }),
  getDailyCount: (id: string) => api.get(`/inventory/daily-counts/${id}`),
  getDailyCountsByDate: (date: string) => api.get(`/inventory/daily-counts/date/${date}`),
  submitDailyCount: (data: {
    countDate: string;
    items: Array<{ cylinderSize: string; status: string; physicalQuantity: number }>
  }) => api.post('/inventory/daily-counts', data),
  approveDailyCount: (id: string, data: { notes?: string; createAdjustments?: boolean }) =>
    api.post(`/inventory/daily-counts/${id}/approve`, data),
  investigateDailyCount: (id: string, investigationNotes: string) =>
    api.post(`/inventory/daily-counts/${id}/investigate`, { investigationNotes }),
};

// Checklist API
export const checklistApi = {
  getTemplates: (type: string) => api.get('/checklists/templates', { params: { type } }),
  getTemplate: (id: string) => api.get(`/checklists/templates/${id}`),
  startResponse: (templateId: string, contextType: string, contextId?: string) =>
    api.post('/checklists/responses', { templateId, contextType, contextId }),
  updateResponse: (id: string, items: Record<string, unknown>[]) =>
    api.patch(`/checklists/responses/${id}`, { items }),
  completeResponse: (id: string) =>
    api.patch(`/checklists/responses/${id}`, { status: 'completed' }),
};
