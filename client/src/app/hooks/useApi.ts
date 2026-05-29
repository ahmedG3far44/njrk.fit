import { useCallback, useState } from 'react';
import { ApiError, api } from '../lib/api';

interface UseApiState<T> {
  data: T | null;
  error: ApiError | null;
  isLoading: boolean;
}

interface UseApiReturn<T> {
  data: T | null;
  error: ApiError | null;
  isLoading: boolean;
  execute: () => Promise<T | null>;
  reset: () => void;
}

interface UseApiOptions {
  immediate?: boolean;
  skipAuthRefresh?: boolean;
}

export function useApi<T>(
  endpoint: string,
  method: 'get' | 'post' | 'put' | 'delete' = 'get',
  body?: unknown,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    error: null,
    isLoading: false,
  });

  const execute = useCallback(async (): Promise<T | null> => {
    setState({ data: null, error: null, isLoading: true });

    try {
      let result: T;

      switch (method) {
        case 'get':
          result = await api.get<T>(endpoint, { skipAuthRefresh: options.skipAuthRefresh });
          break;
        case 'post':
          result = await api.post<T>(endpoint, body, { skipAuthRefresh: options.skipAuthRefresh });
          break;
        case 'put':
          result = await api.put<T>(endpoint, body, { skipAuthRefresh: options.skipAuthRefresh });
          break;
        case 'delete':
          result = await api.delete<T>(endpoint, { skipAuthRefresh: options.skipAuthRefresh });
          break;
      }

      setState({ data: result, error: null, isLoading: false });
      return result;
    } catch (err) {
      const error = err instanceof ApiError ? err : new ApiError(new Response('Unknown error', { status: 500 }));
      setState({ data: null, error, isLoading: false });
      return null;
    }
  }, [endpoint, method, body, options.skipAuthRefresh]);

  const reset = useCallback(() => {
    setState({ data: null, error: null, isLoading: false });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

export function useAuthApi<T>(
  endpoint: string,
  method: 'get' | 'post' | 'put' | 'delete' = 'get',
  body?: unknown
): UseApiReturn<T> {
  return useApi<T>(endpoint, method, body, { skipAuthRefresh: false });
}

export { ApiError };