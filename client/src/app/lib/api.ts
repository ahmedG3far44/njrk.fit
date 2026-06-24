const NETWORK_RETRY_COUNT = 2;

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
      : response.status === 0
        ? 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.'
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

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(resolveUrl(AUTH_REFRESH_ENDPOINT), {
          method: 'POST',
          credentials: 'include',
          signal: controller.signal,
        });

        if (!response.ok) {
          window.dispatchEvent(new Event('njerka:unauthorized'));
          throw new ApiError(response);
        }
      } catch (error) {
        if (error instanceof ApiError) throw error;
        window.dispatchEvent(new Event('njerka:unauthorized'));
        throw error;
      } finally {
        clearTimeout(timer);
        refreshPromise = null;
      }
    })();
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
    const { skipAuthRefresh, timeout = 120000, ...requestOptions } = options;
    const headers: ApiHeaders = {
      ...(requestOptions.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(requestOptions.headers as ApiHeaders | undefined),
    };

    const baseConfig = await applyRequestInterceptors({ ...requestOptions, headers });

    let lastError: unknown;

    for (let attempt = 0; attempt <= NETWORK_RETRY_COUNT; attempt++) {
      const controller = new AbortController();
      const timer = timeout > 0 ? setTimeout(() => controller.abort(), timeout) : null;

      try {
        const config = { ...baseConfig, signal: controller.signal };
        let response = await applyResponseInterceptors(await fetch(resolveUrl(endpoint), config));

        if (response.status === 401 && !skipAuthRefresh) {
          await refreshAccessToken();
          response = await applyResponseInterceptors(await fetch(resolveUrl(endpoint), config));
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
      } catch (error) {
        lastError = error;

        if (
          attempt < NETWORK_RETRY_COUNT &&
          (error instanceof TypeError || (error instanceof DOMException && error.name === 'AbortError'))
        ) {
          await delay(Math.pow(2, attempt) * 1000);
          continue;
        }

        throw error;
      } finally {
        if (timer) clearTimeout(timer);
      }
    }

    throw lastError;
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
