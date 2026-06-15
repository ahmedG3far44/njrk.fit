type ApiHeaders = Record<string, string>;

type RequestInterceptor = (config: RequestInit) => RequestInit | Promise<RequestInit>;
type ResponseInterceptor = (response: Response) => Response | Promise<Response>;

interface ApiRequestOptions extends RequestInit {
  skipAuthRefresh?: boolean;
}

class ApiError extends Error {
  status: number;
  response: Response;
  data?: any; // 👈 ضفنا هذي عشان نمسك بيانات الباك اند

  constructor(response: Response, data?: any) {
    // 👈 هنا نقوله: خذ رسالة الباك اند، وإذا ما لقيت حط رسالتك القديمة
    const message = data?.error || data?.message || `API request failed with status ${response.status}`;
    
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
    const { skipAuthRefresh, ...requestOptions } = options;
    const headers: ApiHeaders = {
      ...(requestOptions.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(requestOptions.headers as ApiHeaders | undefined),
    };

    const config = await applyRequestInterceptors({ ...requestOptions, headers });
    let response = await applyResponseInterceptors(await fetch(resolveUrl(endpoint), config));

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
      let errorData;
      try {
        // ننسخ الرد ونحاول نقرأ الـ JSON اللي فيه
        errorData = await response.clone().json();
      } catch {
        // إذا ما قدر يقرأه (مثلاً مو JSON)، يكمل طبيعي
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
