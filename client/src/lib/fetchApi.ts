const API_URL = import.meta.env.VITE_API_URL as string;


const jsonHeaders = {
  'Content-Type': 'application/json',

};
const formHeaders = {

  'Content-Type': 'multipart/form-data',
};
const pdfHeaders = {
  'Accept': 'application/pdf',
  'Content-Type': 'application/pdf',
};


async function parseJSON<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || 'Request failed');
  }

  return data;
}

async function request<T>(
  url: string,
  options: RequestInit = {},
  isPublic: boolean = false
): Promise<T> {
  const makeRequest = () =>
    fetch(API_URL + url, {
      ...options,
      credentials: 'include', // ✅ always include cookies
    });

  let res = await makeRequest();

  // ✅ Only handle auth logic for protected routes
  if (!isPublic && res.status === 401) {
    const refreshRes = await fetch(`${API_URL}/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include',
    });
    console.log(refreshRes, "refreshRes");
    const jsonRes = await refreshRes.json();
    console.log(jsonRes, "jsonRes");

    if (refreshRes.ok) {
      // 🔁 retry original request
      res = await makeRequest();
    } else {
      // ❌ session dead
      localStorage.removeItem('user');
      // window.location.href = '/login';
      throw new Error('Session expired');
    }
  }

  return parseJSON<T>(res);
}

export const api = {
  get: <T>(url: string) =>
    request<T>(url, {
      method: 'GET',
    }),

  post: <T>(url: string, data?: unknown, isPublic: boolean = false) =>
    request<T>(url, {
      method: 'POST',
      headers: jsonHeaders,
      ...(data && { body: JSON.stringify(data) }),
    }, isPublic),

  postFormData: <T>(url: string, data: FormData) =>
    request<T>(url, {
      method: 'POST',
      body: data,
    }),

  getPdf: <T>(url: string) =>
    request<T>(url, {
      method: 'GET',
      headers: pdfHeaders,
    }),

  put: <T>(url: string, data?: unknown) =>
    request<T>(url, {
      method: 'PUT',
      headers: jsonHeaders,
      ...(data && { body: JSON.stringify(data) }),
    }),
  patch: <T>(url: string, data?: unknown) =>
    request<T>(url, {
      method: 'PATCH',
      headers: jsonHeaders,
      ...(data && { body: JSON.stringify(data) }),
    }),

  delete: <T>(url: string) =>
    request<T>(url, {
      method: 'DELETE',
    }),
};