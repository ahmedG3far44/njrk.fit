const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const ADMIN_TOKEN_KEY = 'njerka_admin_token';
const ADMIN_USER_KEY = 'njerka_admin_user';

interface AdminUser {
  _id: string;
  email: string;
  name: string;
  role: string;
}

const getToken = (): string | null => localStorage.getItem(ADMIN_TOKEN_KEY);
const setToken = (token: string) => localStorage.setItem(ADMIN_TOKEN_KEY, token);
const removeToken = () => localStorage.removeItem(ADMIN_TOKEN_KEY);

const getAdminUser = (): AdminUser | null => {
  try {
    const stored = localStorage.getItem(ADMIN_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const setAdminUser = (user: AdminUser) => {
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
};

const removeAdminUser = () => {
  localStorage.removeItem(ADMIN_USER_KEY);
};

const resolveUrl = (endpoint: string) => {
  if (/^https?:\/\//.test(endpoint)) return endpoint;
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

class AdminApiError extends Error {
  status: number;
  response: Response;

  constructor(response: Response) {
    super(`Admin API request failed with status ${response.status}`);
    this.name = 'AdminApiError';
    this.status = response.status;
    this.response = response;
  }
}

const parseResponse = async <T>(response: Response): Promise<T> => {
  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) return response.json() as Promise<T>;
  return response.text() as Promise<T>;
};

export const adminApi = {
  getToken,
  setToken,
  removeToken,
  getAdminUser,
  setAdminUser,
  removeAdminUser,

  isAuthenticated: (): boolean => {
    return !!getToken();
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    const response = await fetch(resolveUrl(endpoint), config);

    if (response.status === 401) {
      removeToken();
      removeAdminUser();
      window.dispatchEvent(new Event('njerka:admin-unauthorized'));
      throw new AdminApiError(response);
    }

    if (!response.ok) {
      throw new AdminApiError(response);
    }

    return parseResponse<T>(response);
  },

  get<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T>(endpoint: string, body?: unknown, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  },

  put<T>(endpoint: string, body?: unknown, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  },

  patch<T>(endpoint: string, body?: unknown, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  },

  delete<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  },
};

export { AdminApiError };
export type { AdminUser };
