/**
 * lib/api.ts
 * ==========
 * Axios client for the Retentio FastAPI backend.
 *
 * All requests are routed to /api/* — in dev Vite proxies this to the
 * FastAPI server (http://localhost:8000). In production the same origin
 * serves both the SPA and the API.
 *
 * JWT is read from / written to localStorage under the key "retentio_token".
 */

import axios, { type AxiosError, type AxiosResponse } from 'axios';
import type {
  BenchmarkUpdate,
  CustomerDetail,
  CustomerRow,
  DashboardSummary,
  DashboardTrend,
  PredictResponse,
  ProfileUpdate,
  TokenResponse,
  User,
} from './types';

export const TOKEN_KEY = 'retentio_token';

// ── Axios instance ────────────────────────────────────────────────────────────

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  'https://retentio-backend.onrender.com'
).replace(/\/+$/, '');

const client = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

// Attach JWT on every request if present
client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Unwrap FastAPI error detail strings
client.interceptors.response.use(
  (res: AxiosResponse) => res,
  (err: AxiosError<{ detail?: string }>) => {
    const message =
      err.response?.data?.detail ??
      err.message ??
      'Something went wrong. Please try again.';
    return Promise.reject(new Error(message));
  },
);

// ── Auth API ──────────────────────────────────────────────────────────────────

export const authApi = {
  signup: (body: {
    business_name: string;
    name: string;
    email: string;
    password: string;
  }): Promise<TokenResponse> =>
    client.post<TokenResponse>('/auth/signup', body).then((r) => r.data),

  login: (email: string, password: string): Promise<TokenResponse> =>
    client.post<TokenResponse>('/auth/login', { email, password }).then((r) => r.data),

  me: (): Promise<User> =>
    client.get<User>('/auth/me').then((r) => r.data),
};

// ── Predict API ───────────────────────────────────────────────────────────────

export const predictApi = {
  upload: (file: File): Promise<PredictResponse> => {
    const form = new FormData();
    form.append('file', file);
    return client
      .post<PredictResponse>('/predict/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  /**
   * Returns a URL string; the browser navigates there directly to trigger the
   * PDF download from the static public folder (no auth or backend needed).
   */
  templateUrl: () => '/downloads/Customer-CSV-Template-Guide.pdf',
};

// ── Customers API ─────────────────────────────────────────────────────────────

export const customersApi = {
  atRisk: (): Promise<CustomerRow[]> =>
    client.get<{ customers: CustomerRow[] }>('/customers/at-risk').then((r) => r.data.customers),

  saved: (): Promise<CustomerRow[]> =>
    client.get<{ customers: CustomerRow[] }>('/customers/saved').then((r) => r.data.customers),

  search: (q: string, status?: string): Promise<CustomerRow[]> =>
    client
      .get<{ customers: CustomerRow[] }>('/customers/search', { params: { q, status } })
      .then((r) => r.data.customers),

  detail: (customerId: string): Promise<CustomerDetail> =>
    client.get<CustomerDetail>(`/customers/${customerId}`).then((r) => r.data),
};

// ── Dashboard API ─────────────────────────────────────────────────────────────

export const dashboardApi = {
  summary: (): Promise<DashboardSummary> =>
    client.get<DashboardSummary>('/dashboard/summary').then((r) => r.data),

  trend: (): Promise<DashboardTrend> =>
    client.get<DashboardTrend>('/dashboard/trend').then((r) => r.data),
};

// ── Settings API ──────────────────────────────────────────────────────────────

export const settingsApi = {
  updateProfile: (body: ProfileUpdate): Promise<User> =>
    client.patch<User>('/settings/profile', body).then((r) => r.data),

  updateBenchmark: (benchmark: number): Promise<User> =>
    client.patch<User>('/settings/benchmark', { benchmark } as BenchmarkUpdate).then((r) => r.data),
};
