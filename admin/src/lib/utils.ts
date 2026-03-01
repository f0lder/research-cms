import { API_URL } from '../config';
import { ContentTypeDefinition } from '@research-cms/shared-types';

// ============================================
// API Request Helpers
// ============================================

interface RequestOptions {
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
	body?: any;
	headers?: Record<string, string>;
}

export async function apiRequest<T>(
	endpoint: string,
	options: RequestOptions = {}
): Promise<{ data?: T; error?: string }> {
	try {
		const { method = 'GET', body, headers = {} } = options;

		const config: RequestInit = {
			method,
			headers: {
				'Content-Type': 'application/json',
				...headers,
			},
		};

		if (body) {
			config.body = JSON.stringify(body);
		}

		const response = await fetch(`${API_URL}${endpoint}`, config);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
			return { error: errorData.message || `Request failed with status ${response.status}` };
		}

		// Handle 204 No Content
		if (response.status === 204) {
			return { data: undefined as T };
		}

		const data = await response.json();
		return { data };
	} catch (err) {
		return { error: err instanceof Error ? err.message : 'Network error - is API running?' };
	}
}

// Convenience methods
export const api = {
	get: <T>(endpoint: string) =>
		apiRequest<T>(endpoint, { method: 'GET' }),

	post: <T>(endpoint: string, body: any) =>
		apiRequest<T>(endpoint, { method: 'POST', body }),

	put: <T>(endpoint: string, body: any) =>
		apiRequest<T>(endpoint, { method: 'PUT', body }),

	delete: <T>(endpoint: string) =>
		apiRequest<T>(endpoint, { method: 'DELETE' }),
};

// ============================================
// Slug Utilities
// ============================================

export function sanitizeSlug(input: string): string {
	return input
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9-]/g, '-')  // Replace non-alphanumeric with dash
		.replace(/-+/g, '-')          // Replace multiple dashes with single
		.replace(/^-|-$/g, '');       // Remove leading/trailing dashes
}

export function generateSlugFromName(name: string): string {
	return sanitizeSlug(name);
}

export function validateSlug(slug: string): { valid: boolean; error?: string } {
	if (!slug) {
		return { valid: false, error: 'Slug is required' };
	}

	if (slug.length < 2) {
		return { valid: false, error: 'Slug must be at least 2 characters' };
	}

	if (!/^[a-z0-9-]+$/.test(slug)) {
		return { valid: false, error: 'Slug can only contain lowercase letters, numbers, and dashes' };
	}

	if (slug.startsWith('-') || slug.endsWith('-')) {
		return { valid: false, error: 'Slug cannot start or end with a dash' };
	}

	return { valid: true };
}

// ============================================
// Form Utilities
// ============================================

export function getFieldInputType(fieldType: string): string {
	switch (fieldType) {
		case 'text':
			return 'text';
		case 'number':
			return 'number';
		case 'boolean':
			return 'checkbox';
		case 'image':
			return 'url';
		default:
			return 'text';
	}
}

export function formatFieldValue(value: any, fieldType: string): any {
	if (value === '' || value === null || value === undefined) {
		return fieldType === 'boolean' ? false : '';
	}

	switch (fieldType) {
		case 'number':
			return Number(value);
		case 'boolean':
			return Boolean(value);
		default:
			return String(value);
	}
}

// ============================================
// Date Utilities
// ============================================

export function formatDate(date: string | Date): string {
	const d = new Date(date);
	return d.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});
}

export function formatDateTime(date: string | Date): string {
	const d = new Date(date);
	return d.toLocaleString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

// ============================================
// Validation Utilities
// ============================================

export function validateRequired(value: any, fieldName: string): string | null {
	if (value === '' || value === null || value === undefined) {
		return `${fieldName} is required`;
	}
	return null;
}

export function validateUrl(url: string): boolean {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}

// ============================================
// Error Display Utilities
// ============================================

export function getErrorMessage(error: unknown): string {
	if (typeof error === 'string') return error;
	if (error instanceof Error) return error.message;
	if (error && typeof error === 'object' && 'message' in error) {
		return String(error.message);
	}
	return 'An unknown error occurred';
}

// ============================================
// Schema API
// ============================================

export async function getAllSchemas(): Promise<{ data?: ContentTypeDefinition[]; error?: string }> {
	return api.get<ContentTypeDefinition[]>('/schemas');
}

export async function getSchema(slug: string): Promise<{ data?: ContentTypeDefinition; error?: string }> {
	return api.get<ContentTypeDefinition>(`/schemas/${slug}`);
}

export async function createSchema(
	payload: Omit<ContentTypeDefinition, '_id'>
): Promise<{ data?: ContentTypeDefinition; error?: string }> {
	return api.post<ContentTypeDefinition>('/schemas', payload);
}

export async function updateSchema(
	slug: string,
	payload: Partial<ContentTypeDefinition>
): Promise<{ data?: ContentTypeDefinition; error?: string }> {
	return api.put<ContentTypeDefinition>(`/schemas/${slug}`, payload);
}

export async function deleteSchema(slug: string): Promise<{ error?: string }> {
	return api.delete(`/schemas/${slug}`);
}