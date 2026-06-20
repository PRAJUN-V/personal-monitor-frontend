import type {
  HealthRecord,
  ManagedUser,
  Source,
  Transaction,
  UserProfile,
} from "./types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

const TOKEN_KEY = "pm_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/** Thrown when the backend rejects the JWT (expired / invalid). */
export class UnauthorizedError extends Error {}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    throw new UnauthorizedError("Session expired");
  }

  if (!res.ok) {
    let detail = "Request failed";
    try {
      const data = await res.json();
      if (Array.isArray(data.detail)) detail = data.detail[0]?.msg ?? detail;
      else if (typeof data.detail === "string") detail = data.detail;
    } catch {
      /* ignore body parse errors */
    }
    throw new Error(detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  async login(username: string, password: string): Promise<string> {
    const body = new URLSearchParams();
    body.append("username", username);
    body.append("password", password);

    const res = await fetch(`${API_URL}/token`, { method: "POST", body });
    if (!res.ok) throw new Error("Invalid username or password");
    const data = await res.json();
    return data.access_token as string;
  },

  me: () => request<UserProfile>("/api/me"),

  // Admin: user management
  listUsers: () => request<ManagedUser[]>("/api/users"),
  createUser: (payload: { username: string; password: string; is_admin: boolean }) =>
    request<ManagedUser>("/api/users", { method: "POST", body: JSON.stringify(payload) }),
  updateUser: (
    id: number,
    payload: { username?: string; password?: string; is_admin?: boolean },
  ) => request<ManagedUser>(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteUser: (id: number) =>
    request<{ message: string }>(`/api/users/${id}`, { method: "DELETE" }),

  // Health
  listHealth: (page: number, pageSize = 5) =>
    request<HealthRecord[]>(`/api/health?skip=${page * pageSize}&limit=${pageSize}`),
  createHealth: (payload: unknown) =>
    request<HealthRecord>("/api/health", { method: "POST", body: JSON.stringify(payload) }),
  updateHealth: (id: number, payload: unknown) =>
    request<HealthRecord>(`/api/health/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteHealth: (id: number) =>
    request<{ message: string }>(`/api/health/${id}`, { method: "DELETE" }),

  // Finance
  listSources: () => request<Source[]>("/api/sources"),
  createSource: (payload: { name: string; balance: number }) =>
    request<Source>("/api/sources", { method: "POST", body: JSON.stringify(payload) }),
  listTransactions: (page: number, pageSize = 5) =>
    request<Transaction[]>(`/api/transactions?skip=${page * pageSize}&limit=${pageSize}`),
  createTransaction: (payload: unknown) =>
    request<Transaction>("/api/transactions", { method: "POST", body: JSON.stringify(payload) }),
  deleteTransaction: (id: number) =>
    request<{ message: string }>(`/api/transactions/${id}`, { method: "DELETE" }),
};
