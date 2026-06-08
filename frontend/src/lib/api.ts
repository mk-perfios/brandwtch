import axios from "axios";
import type {
  TokenResponse,
  User,
  Organization,
  OrgMember,
  Brand,
  BrandCreate,
  BrandStats,
  MentionPage,
  AnalyticsDashboard,
  OverviewStats,
  Alert,
  AlertCreate,
  AlertEvent,
  MonitorStatus,
} from "@/types";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const orgId = typeof window !== "undefined" ? localStorage.getItem("org_id") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (orgId) config.headers["X-Org-Id"] = orgId;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        try {
          const { data } = await axios.post<TokenResponse>("/api/auth/refresh", {
            refresh_token: refresh,
          });
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          err.config.headers.Authorization = `Bearer ${data.access_token}`;
          return api(err.config);
        } catch {
          localStorage.clear();
          window.location.href = "/login";
        }
      } else {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

// --- Auth ---
export const authApi = {
  register: (data: { email: string; password: string; full_name?: string; org_name: string }) =>
    api.post<TokenResponse>("/auth/register", data).then((r) => r.data),

  login: (email: string, password: string) =>
    api.post<TokenResponse>("/auth/login", { email, password }).then((r) => r.data),

  refresh: (refresh_token: string) =>
    api.post<TokenResponse>("/auth/refresh", { refresh_token }).then((r) => r.data),

  me: () => api.get<User>("/auth/me").then((r) => r.data),
};

// --- Orgs ---
export const orgsApi = {
  list: () => api.get<Organization[]>("/orgs/").then((r) => r.data),

  members: (orgId: string) =>
    api.get<OrgMember[]>(`/orgs/${orgId}/members`).then((r) => r.data),

  invite: (orgId: string, email: string, role = "member") =>
    api.post(`/orgs/${orgId}/members/invite`, { email, role }).then((r) => r.data),

  removeMember: (orgId: string, userId: string) =>
    api.delete(`/orgs/${orgId}/members/${userId}`).then((r) => r.data),
};

// --- Brands ---
export const brandsApi = {
  list: () => api.get<Brand[]>("/brands/").then((r) => r.data),

  get: (id: string) => api.get<Brand>(`/brands/${id}`).then((r) => r.data),

  create: (data: BrandCreate) => api.post<Brand>("/brands/", data).then((r) => r.data),

  update: (id: string, data: Partial<BrandCreate>) =>
    api.patch<Brand>(`/brands/${id}`, data).then((r) => r.data),

  delete: (id: string) => api.delete(`/brands/${id}`).then((r) => r.data),

  stats: (id: string) => api.get<BrandStats>(`/brands/${id}/stats`).then((r) => r.data),
};

// --- Mentions ---
export const mentionsApi = {
  list: (params?: {
    brand_id?: string;
    platform?: string;
    sentiment?: string;
    page?: number;
    size?: number;
    days?: number;
    search?: string;
  }) => api.get<MentionPage>("/mentions/", { params }).then((r) => r.data),

  get: (id: string) => api.get(`/mentions/${id}`).then((r) => r.data),
};

// --- Analytics ---
export const analyticsApi = {
  overview: () => api.get<OverviewStats>("/analytics/overview").then((r) => r.data),

  brand: (brandId: string, days = 30) =>
    api.get<AnalyticsDashboard>(`/analytics/${brandId}`, { params: { days } }).then((r) => r.data),
};

// --- Alerts ---
export const alertsApi = {
  list: (brandId?: string) =>
    api.get<Alert[]>("/alerts/", { params: brandId ? { brand_id: brandId } : {} }).then((r) => r.data),

  create: (data: AlertCreate) => api.post<Alert>("/alerts/", data).then((r) => r.data),

  update: (id: string, data: Partial<AlertCreate> & { is_active?: boolean }) =>
    api.patch<Alert>(`/alerts/${id}`, data).then((r) => r.data),

  delete: (id: string) => api.delete(`/alerts/${id}`).then((r) => r.data),

  events: (id: string) => api.get<AlertEvent[]>(`/alerts/${id}/events`).then((r) => r.data),
};

// --- Monitor ---
export const monitorApi = {
  runBrand: (brandId: string, platforms?: string[]) =>
    api.post(`/monitor/run/${brandId}`, { platforms }).then((r) => r.data),

  runAll: () => api.post("/monitor/run-all").then((r) => r.data),

  status: () => api.get<MonitorStatus[]>("/monitor/status").then((r) => r.data),
};

export default api;
