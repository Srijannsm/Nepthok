import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

const api = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("nepthok_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("nepthok_token");
      localStorage.removeItem("nepthok_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

// Public API — no auth header, no 401 redirect to /login
export const publicApi = axios.create({
  baseURL: BASE + "/v1",
  headers: { "Content-Type": "application/json" },
});

export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await api.get<{ data: T }>(url, { params });
  return res.data.data;
}

export async function post<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.post<{ data: T }>(url, body);
  return res.data.data;
}

export async function patch<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.patch<{ data: T }>(url, body);
  return res.data.data;
}

export async function del<T>(url: string): Promise<T> {
  const res = await api.delete<{ data: T }>(url);
  return res.data.data;
}

export default api;
