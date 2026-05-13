const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function normalizeDetail(detail) {
  if (detail == null) return "Request failed";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) =>
        typeof item === "object" && item.msg != null ? item.msg : JSON.stringify(item)
      )
      .join("; ");
  }
  if (typeof detail === "object" && detail.msg != null) return String(detail.msg);
  try {
    return JSON.stringify(detail);
  } catch {
    return "Request failed";
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const TOKEN_KEY = "socratix_token";

function readStoredToken() {
  const raw = localStorage.getItem(TOKEN_KEY);
  return raw ? String(raw).trim() : "";
}

/** Save JWT from login/register response (supports accessToken or access_token). */
export function persistAccessToken(payload) {
  const raw = payload?.accessToken ?? payload?.access_token ?? "";
  const token = String(raw).trim();
  if (token) localStorage.setItem(TOKEN_KEY, token);
  return token;
}

function getAuthHeader() {
  const token = readStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const { skipAuth = false, ...fetchOptions } = options;
  const authHeaders = skipAuth ? {} : getAuthHeader();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...(fetchOptions.headers || {}),
    },
    ...fetchOptions,
  });

  if (!response.ok) {
    let detail = `API request failed with ${response.status}`;

    try {
      const body = await response.json();
      detail = normalizeDetail(body.detail ?? body.message ?? detail);
    } catch {
      // ignore
    }

    throw new ApiError(detail, response.status);
  }

  if (response.status === 204) return null;

  return response.json();
}

export const ideasApi = {
  list: () => request("/ideas"),

  get: (ideaId) => request(`/ideas/${ideaId}`),

  create: (payload) =>
    request("/ideas", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (ideaId, payload) =>
    request(`/ideas/${ideaId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  remove: (ideaId) =>
    request(`/ideas/${ideaId}`, {
      method: "DELETE",
    }),

  vote: (ideaId, userId) =>
    request(`/ideas/${ideaId}/vote`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),

  submitDevil: (ideaId, payload) =>
    request(`/ideas/${ideaId}/devil`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  addComment: (ideaId, payload) =>
    request(`/ideas/${ideaId}/comments`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const usersApi = {
  list: () => request("/users"),
};

export const authApi = {
  register: (payload) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuth: true,
    }),

  login: (payload) => {
    const body = new URLSearchParams();
    body.set("username", payload.email);
    body.set("password", payload.password);

    return request("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      skipAuth: true,
    });
  },

  me: () => request("/auth/me"),

  forgotPassword: (payload) =>
    request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuth: true,
    }),

  resetPassword: (payload) =>
    request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuth: true,
    }),
};
