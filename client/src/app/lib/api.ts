type ApiHeaders = Record<string, string>;

type RequestInterceptor = (config: RequestInit) => RequestInit | Promise<RequestInit>;
type ResponseInterceptor = (response: Response) => Response | Promise<Response>;

export interface ApiRequestOptions extends RequestInit {
  skipAuthRefresh?: boolean;
  timeout?: number;
}

class ApiError extends Error {
  status: number;
  response: Response;
  data?: unknown;

  constructor(response: Response, data?: unknown) {
    const message = (data && typeof data === 'object' && ('error' in data || 'message' in data))
      ? String((data as Record<string, unknown>).error || (data as Record<string, unknown>).message)
      : `API request failed with status ${response.status}`;
    
    super(message);
    this.name = 'ApiError';
    this.status = response.status;
    this.response = response;
    this.data = data;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const AUTH_REFRESH_ENDPOINT = import.meta.env.VITE_AUTH_REFRESH_ENDPOINT ?? '/auth/refresh-token';

let refreshPromise: Promise<void> | null = null;

const requestInterceptors: RequestInterceptor[] = [
  (config) => ({
    ...config,
    credentials: 'include',
  }),
];

const responseInterceptors: ResponseInterceptor[] = [
  (response) => response,
];

const resolveUrl = (endpoint: string) => {
  if (/^https?:\/\//.test(endpoint)) return endpoint;
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

const applyRequestInterceptors = async (config: RequestInit) => {
  let nextConfig = config;

  for (const interceptor of requestInterceptors) {
    nextConfig = await interceptor(nextConfig);
  }

  return nextConfig;
};

const applyResponseInterceptors = async (response: Response) => {
  let nextResponse = response;

  for (const interceptor of responseInterceptors) {
    nextResponse = await interceptor(nextResponse);
  }

  return nextResponse;
};

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = fetch(resolveUrl(AUTH_REFRESH_ENDPOINT), {
      method: 'POST',
      credentials: 'include',
    }).then((response) => {
      if (!response.ok) {
        window.dispatchEvent(new Event('njerka:unauthorized'));
        throw new ApiError(response);
      }
    }).finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }

  return response.text() as Promise<T>;
};

export const api = {
  addRequestInterceptor(interceptor: RequestInterceptor) {
    requestInterceptors.push(interceptor);
  },

  addResponseInterceptor(interceptor: ResponseInterceptor) {
    responseInterceptors.push(interceptor);
  },

  async request<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    const { skipAuthRefresh, timeout = 30000, ...requestOptions } = options;
    const headers: ApiHeaders = {
      ...(requestOptions.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(requestOptions.headers as ApiHeaders | undefined),
    };

    const controller = new AbortController();
    const timer = timeout > 0 ? setTimeout(() => controller.abort(), timeout) : null;

    const config = await applyRequestInterceptors({ ...requestOptions, headers, signal: controller.signal });
    let response: Response;
    try {
      response = await applyResponseInterceptors(await fetch(resolveUrl(endpoint), config));
    } finally {
      if (timer) clearTimeout(timer);
    }

    if (response.status === 401 && !skipAuthRefresh) {
      try {
        await refreshAccessToken();
        response = await applyResponseInterceptors(await fetch(resolveUrl(endpoint), config));
      } catch {
        window.dispatchEvent(new Event('njerka:unauthorized'));
        throw new ApiError(response);
      }
    }
    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.clone().json();
      } catch {
        // Non-JSON error response
      }
      throw new ApiError(response, errorData);
    }

    return parseResponse<T>(response);
  },

  get<T>(endpoint: string, options?: ApiRequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T>(endpoint: string, body?: unknown, options?: ApiRequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body === undefined ? undefined : (body instanceof FormData ? body : JSON.stringify(body)),
    });
  },

  put<T>(endpoint: string, body?: unknown, options?: ApiRequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body === undefined ? undefined : (body instanceof FormData ? body : JSON.stringify(body)),
    });
  },

  delete<T>(endpoint: string, options?: ApiRequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  },

  patch<T>(endpoint: string, body?: unknown, options?: ApiRequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body === undefined ? undefined : (body instanceof FormData ? body : JSON.stringify(body)),
    });
  },
};

export { ApiError };
