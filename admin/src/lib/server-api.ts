import { cookies } from 'next/headers';
import { API_URL } from '@/config';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * Server-side API client for use in Server Actions.
 * Reads auth token from cookies instead of localStorage.
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<{ data?: T; error?: string }> {
  try {
    const { method = 'GET', body, headers = {} } = options;

    // Read session cookie (server-side)
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(sessionId && { Cookie: `session=${sessionId}` }),
        ...headers,
      },
      credentials: 'include',
    };
    if (body) config.body = JSON.stringify(body);

    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (response.status === 401) {
      return { error: 'Unauthorized' };
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Unknown error' }));
      return { error: err.message || `Request failed with status ${response.status}` };
    }

    if (response.status === 204) return { data: undefined as T };

    return { data: await response.json() };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Network error' };
  }
}

export const serverApi = {
  get:    <T>(endpoint: string)              => apiRequest<T>(endpoint, { method: 'GET' }),
  post:   <T>(endpoint: string, body: unknown) => apiRequest<T>(endpoint, { method: 'POST',  body }),
  put:    <T>(endpoint: string, body: unknown) => apiRequest<T>(endpoint, { method: 'PUT',   body }),
  patch:  <T>(endpoint: string, body: unknown) => apiRequest<T>(endpoint, { method: 'PATCH', body }),
  delete: <T>(endpoint: string, body?: unknown) => apiRequest<T>(endpoint, body ? { method: 'DELETE', body } : { method: 'DELETE' }),
};
