const BASE = "/api";

function getToken(): string | null {
  try {
    const raw = localStorage.getItem("picksmart-auth-store");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { jwtToken?: string } };
    return parsed?.state?.jwtToken ?? null;
  } catch {
    return null;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface ServerUser {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  role: string;
  status: string;
  subscriptionPlan: string | null;
  isSubscribed: boolean;
  accountNumber: string;
  warehouseId: string | null;
  warehouseSlug: string | null;
  isMaster: boolean;
  createdAt: string;
  updatedAt: string;
}

export const psaApi = {
  login: (username: string, password: string) =>
    request<{ token: string; user: ServerUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  me: () => request<{ user: ServerUser }>("/auth/me"),

  listUsers: () => request<{ users: ServerUser[] }>("/auth/users"),

  banUser: (id: string) =>
    request<{ user: ServerUser }>(`/auth/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "banned" }),
    }),

  unbanUser: (id: string) =>
    request<{ user: ServerUser }>(`/auth/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "active" }),
    }),

  changeRole: (id: string, role: string) =>
    request<{ user: ServerUser }>(`/auth/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  deleteUser: (id: string) =>
    request<{ ok: boolean }>(`/auth/users/${id}`, { method: "DELETE" }),

  createUser: (data: {
    username: string;
    password: string;
    fullName: string;
    role: string;
    email?: string;
    warehouseId?: string | null;
    warehouseSlug?: string | null;
  }) =>
    request<{ user: ServerUser }>("/auth/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  acceptInvite: (token: string, username: string, password: string) =>
    request<{ token: string; user: ServerUser }>("/auth/invite/accept", {
      method: "POST",
      body: JSON.stringify({ token, username, password }),
    }),

  resetPassword: (email: string, newPassword: string) =>
    request<{ ok: boolean }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, newPassword }),
    }),

  getInvite: (token: string) =>
    request<{
      invite: {
        fullName: string;
        email: string;
        role: string;
        warehouseId: string | null;
        warehouseSlug: string | null;
        usedAt: string | null;
      };
    }>(`/auth/invite/${token}`),
};
