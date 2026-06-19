import { API_URL } from '@/config';
import { ContentEntry } from '@research-cms/shared-types';

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

    const config: RequestInit = {
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };
    if (body) config.body = JSON.stringify(body);

    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (response.status === 401) {
      // Don't redirect from /login or /register (already on public routes)
      const isPublicPage = typeof window !== 'undefined' && ['/login', '/register'].includes(window.location.pathname);
      if (!isPublicPage && typeof window !== 'undefined') {
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
  delete: <T>(endpoint: string, body?: unknown) => apiRequest<T>(endpoint, body ? { method: 'DELETE', body } : { method: 'DELETE' }),
};

// ── Routing ───────────────────────────────────────────────────────────────────

/** Single source of truth for all admin URL paths. */
export const adminRoutes = {
  schemas:       '/schemas',
  schemaCreate:  '/schemas/create',
  schemaEdit:    (slug: string) => `/schemas/edit/${slug}`,
  schemaDetail:  (slug: string) => `/schemas/${slug}`,
  contentCreate: (slug: string) => `/schemas/${slug}/content/create`,
  contentEdit:   (slug: string, id: string) => `/schemas/${slug}/content/edit/${id}`,
  clients:       '/clients',
  clientDetail:  (id: string) => `/clients/${id}`,
  clientUsage:   (id: string) => `/clients/${id}/usage`,
  clientLayout:  (id: string, schemaSlug: string) => `/clients/${id}/layout/${schemaSlug}`,
  clientPageNew: (id: string) => `/clients/${id}/pages/new`,
  clientPageEdit:(id: string, pageSlug: string) => `/clients/${id}/pages/${pageSlug}`,
  clientMenus:   (id: string) => `/clients/${id}/menus`,
  clientMenuEdit:(id: string, menuId: string) => `/clients/${id}/menus/${menuId}`,
  webhooks:       '/webhooks',
  webhookNew:     '/webhooks/new',
  webhookEdit:    (id: string) => `/webhooks/${id}`,
  users:          '/users',
  userEdit:       (id: string) => `/users/${id}`,
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

export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Media Upload (Client-Side Only) ───────────────────────────────────────────

export interface StorageResult {
  key: string;
  url: string;
  size: number;
  mimeType: string;
  originalName: string;
}

/** Upload a file and create a media entry. Returns the full MediaEntry. */
export async function uploadMedia(file: File, title?: string): Promise<import('@research-cms/shared-types').MediaEntry> {
  const form = new FormData();
  form.append('file', file);
  const qs = title ? `?title=${encodeURIComponent(title)}` : '';
  const res = await fetch(`${API_URL}/media/upload${qs}`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Upload failed');
  return json;
}

// ── Exports ───────────────────────────────────────────────────────────────────

export function getExportCsvUrl(slug: string): string {
  return `${API_URL}/content/${slug}/export/csv`;
}
