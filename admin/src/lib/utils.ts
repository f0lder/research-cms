import { API_URL } from '@/config';
import { ContentTypeDefinition, ContentEntry, FieldValue, BlockLayout, BlockDefinition, ApiKey } from '@research-cms/shared-types';

// ── HTTP ──────────────────────────────────────────────────────────────────────

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<{ data?: T; error?: string }> {
  try {
    const { method = 'GET', body, headers = {} } = options;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...headers,
      },
    };
    if (body) config.body = JSON.stringify(body);

    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return { error: 'Unauthorized' };
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Unknown error' }));
      return { error: err.message || `Request failed with status ${response.status}` };
    }

    if (response.status === 204) return { data: undefined as T };

    return { data: await response.json() };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Network error — is the API running?' };
  }
}

export const api = {
  get:    <T>(endpoint: string)              => apiRequest<T>(endpoint, { method: 'GET' }),
  post:   <T>(endpoint: string, body: unknown) => apiRequest<T>(endpoint, { method: 'POST',  body }),
  put:    <T>(endpoint: string, body: unknown) => apiRequest<T>(endpoint, { method: 'PUT',   body }),
  patch:  <T>(endpoint: string, body: unknown) => apiRequest<T>(endpoint, { method: 'PATCH', body }),
  delete: <T>(endpoint: string)              => apiRequest<T>(endpoint, { method: 'DELETE' }),
};

// ── Routing ───────────────────────────────────────────────────────────────────

/** Single source of truth for all admin URL paths. */
export const adminRoutes = {
  schemas:       '/schemas',
  schemaCreate:  '/schemas/create',
  schemaEdit:    (slug: string) => `/schemas/edit/${slug}`,
  schemaDetail:  (slug: string) => `/schemas/${slug}`,
  schemaLayout:  (slug: string) => `/schemas/${slug}/layout`,
  contentCreate: (slug: string) => `/schemas/${slug}/content/create`,
  contentEdit:   (slug: string, id: string) => `/schemas/${slug}/content/edit/${id}`,
  apiKeys:       '/api-keys',
};

/** Extract a single string from Next.js dynamic route params (handles string | string[]). */
export function extractParam(
  params: Record<string, string | string[] | undefined> | null | undefined,
  key: string
): string {
  const v = params?.[key];
  if (!v) return '';
  return Array.isArray(v) ? v[0] : v;
}

// ── Slug / key ────────────────────────────────────────────────────────────────

/** Convert a name like "Blog Post" into a URL slug "blog-post". */
export function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Convert a display label like "Product Title" into a field key "product_title". */
export function labelToFieldKey(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

export function validateSlug(slug: string): { valid: boolean; error?: string } {
  if (!slug)                          return { valid: false, error: 'Slug is required' };
  if (slug.length < 2)                return { valid: false, error: 'Slug must be at least 2 characters' };
  if (!/^[a-z0-9-]+$/.test(slug))    return { valid: false, error: 'Slug can only contain lowercase letters, numbers, and dashes' };
  if (slug.startsWith('-') || slug.endsWith('-')) return { valid: false, error: 'Slug cannot start or end with a dash' };
  return { valid: true };
}

// ── Entries ───────────────────────────────────────────────────────────────────

/** Get a human-readable display title from any content entry. */
export function getEntryTitle(entry: ContentEntry): string {
  if (entry.data.title && typeof entry.data.title === 'string') return entry.data.title;
  const first = Object.values(entry.data).find(v => typeof v === 'string' && v);
  return first ? String(first).slice(0, 40) : `#${entry._id?.slice(-6) ?? '?'}`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Stable random ID for React keys and similar non-cryptographic uses. */
export function generateRandomId(): string {
  return Math.random().toString(36).slice(2);
}

/** Truncate any value to a string of max length, appending "…" if cut. */
export function truncateString(value: unknown, max = 60): string {
  const str = String(value ?? '');
  return str.length > max ? str.slice(0, max) + '…' : str;
}

export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) return String(error.message);
  return 'An unknown error occurred';
}

// ── Date ──────────────────────────────────────────────────────────────────────

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Schema API ────────────────────────────────────────────────────────────────

export const getAllSchemas = () =>
  api.get<ContentTypeDefinition[]>('/schemas');

export const getSchema = (slug: string) =>
  api.get<ContentTypeDefinition>(`/schemas/${slug}`);

export const createSchema = (payload: Omit<ContentTypeDefinition, '_id'>) =>
  api.post<ContentTypeDefinition>('/schemas', payload);

export const updateSchema = (slug: string, payload: Partial<ContentTypeDefinition>) =>
  api.put<ContentTypeDefinition>(`/schemas/${slug}`, payload);

export const deleteSchema = (slug: string) =>
  api.delete(`/schemas/${slug}`);

// ── Content API ───────────────────────────────────────────────────────────────

export const getAllEntries = (schemaSlug: string) =>
  api.get<ContentEntry[]>(`/content/${schemaSlug}`);

export const getEntry = (schemaSlug: string, id: string) =>
  api.get<ContentEntry>(`/content/${schemaSlug}/${id}`);

export const createEntry = (schemaSlug: string, data: Record<string, FieldValue>) =>
  api.post<ContentEntry>(`/content/${schemaSlug}`, { data });

export const updateEntry = (schemaSlug: string, id: string, data: Record<string, FieldValue>) =>
  api.put<ContentEntry>(`/content/${schemaSlug}/${id}`, { data });

export const deleteEntry = (schemaSlug: string, id: string) =>
  api.delete(`/content/${schemaSlug}/${id}`);

// ── Layout API ────────────────────────────────────────────────────────────────

export const getLayout = (schemaSlug: string) =>
  api.get<BlockLayout>(`/layouts/${schemaSlug}`);

export const saveLayout = (schemaSlug: string, blocks: BlockDefinition[]) =>
  api.put<BlockLayout>(`/layouts/${schemaSlug}`, { blocks });

// ── API Keys API ──────────────────────────────────────────────────────────────

export const getAllApiKeys = () =>
  api.get<ApiKey[]>('/api-keys');

export const createApiKey = (name: string) =>
  api.post<ApiKey>('/api-keys', { name });

export const deleteApiKey = (id: string) =>
  api.delete(`/api-keys/${id}`);
