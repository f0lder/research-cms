'use server';

import { serverApi } from '@/lib/server-api';
import {
  ContentTypeDefinition,
  ContentEntry,
  Client,
  ClientPage,
  MediaEntry,
  LogEntry,
  BlockLayout,
  FieldDefinition,
  FieldValue,
  Block,
  Webhook,
} from '@research-cms/shared-types';

// ── Schemas ────────────────────────────────────────────────────────────────

export async function getSchema(slug: string) {
  return serverApi.get<ContentTypeDefinition>(`/schemas/${slug}`);
}

export async function getAllSchemas() {
  return serverApi.get<ContentTypeDefinition[]>(`/schemas`);
}

export async function getSystemSchemas() {
  return serverApi.get<ContentTypeDefinition[]>(`/schemas/system`);
}

export async function createSchema(data: {
  name: string;
  slug: string;
  fields: FieldDefinition[];
}) {
  return serverApi.post(`/schemas`, data);
}

export async function updateSchema(slug: string, data: Partial<ContentTypeDefinition>) {
  return serverApi.put(`/schemas/${slug}`, data);
}

export async function deleteSchema(slug: string) {
  return serverApi.delete(`/schemas/${slug}`);
}

// ── Content ────────────────────────────────────────

export async function getAllEntries(slug: string) {
  return serverApi.get<{ items: ContentEntry[] }>(`/content/${slug}`);
}

export async function getEntry(slug: string, id: string) {
  return serverApi.get<ContentEntry>(`/content/${slug}/${id}`);
}

export async function createEntry(slug: string, data: Record<string, FieldValue>) {
  return serverApi.post<ContentEntry>(`/content/${slug}`, { data });
}

export async function updateEntry(slug: string, id: string, data: Record<string, FieldValue>) {
  return serverApi.put<ContentEntry>(`/content/${slug}/${id}`, { data });
}

export async function deleteEntry(slug: string, id: string) {
  return serverApi.delete(`/content/${slug}/${id}`);
}

export async function duplicateEntry(slug: string, id: string) {
  return serverApi.post<ContentEntry>(`/content/${slug}/${id}/duplicate`, {});
}

export async function bulkUpdateStatus(
  slug: string,
  ids: string[],
  status: 'draft' | 'published' | 'scheduled' | 'archived'
) {
  return serverApi.put(`/content/${slug}/bulk-status`, { ids, status });
}

export async function restoreEntry(slug: string, id: string) {
	return serverApi.put<ContentEntry>(`/content/${slug}/${id}/restore`, {});
}

export async function permanentlyDeleteEntry(slug: string, id: string) {
	return serverApi.delete(`/content/${slug}/${id}/permanent`);
}

export async function searchEntries(slug: string, query: string, page = 1, limit = 20) {
	return serverApi.get<{ items: ContentEntry[]; total: number; page: number; limit: number }>(
		`/content/${slug}/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
	);
}

export async function getTrash(slug: string) {
	return serverApi.get<{ items: ContentEntry[] }>(`/content/${slug}/trash`);
}

export async function getVersions(slug: string, id: string) {
	return serverApi.get<Array<{ entryId: string; schemaSlug: string; data: Record<string, unknown>; version: number; createdAt: string }>>(`/content/${slug}/${id}/versions`);
}

export async function restoreVersion(slug: string, id: string, version: number) {
	return serverApi.patch<ContentEntry>(`/content/${slug}/${id}/versions/${version}`, {});
}

export async function getActivityFeed(limit = 100, offset = 0) {
  return serverApi.get<Array<{ date: string; activities: Array<{ time: string; message: string }> }>>(`/logs/activity-feed?limit=${limit}&offset=${offset}`);
}

// ── Clients ────────────────────────────────────────────────────────────────

export async function getAllClients() {
  return serverApi.get<Client[]>(`/clients`);
}

export async function getClient(id: string) {
  return serverApi.get<Client>(`/clients/${id}`);
}

export async function createClient(name: string) {
  return serverApi.post<Client>(`/clients`, { name });
}

export async function updateClient(id: string, data: Partial<Client>) {
  return serverApi.put<Client>(`/clients/${id}`, data);
}

export async function deleteClient(id: string) {
  return serverApi.delete(`/clients/${id}`);
}

export async function updateClientSchemas(id: string, allowedSchemas: string[]) {
  return serverApi.patch<Client>(`/clients/${id}/schemas`, { allowedSchemas });
}

export async function setClientHomePage(id: string, pageId: string | null) {
  return serverApi.put<Client>(`/clients/${id}/home-page`, { pageId });
}

export async function getClientUsage(id: string, days = 30) {
  return serverApi.get<{ date: string; userCount: number; users: string[]; schemas: Record<string, number> }[]>(
    `/clients/${id}/usage?days=${days}`
  );
}

export async function clearClientUsage(id: string) {
  return serverApi.delete(`/clients/${id}/usage`);
}

// ── Client Pages ───────────────────────────────────────────────────────────

export async function listClientPages(clientId: string) {
  return serverApi.get<ClientPage[]>(`/clients/${clientId}/pages`);
}

export async function getClientPage(clientId: string, pageId: string) {
  return serverApi.get<ClientPage>(`/clients/${clientId}/pages/${pageId}`);
}

export async function createClientPage(
  clientId: string,
  data: { title: string; slug: string; status?: string; blocks?: Block[] }
) {
  return serverApi.post<ClientPage>(`/clients/${clientId}/pages`, data);
}

export async function updateClientPage(
  clientId: string,
  pageId: string,
  data: Partial<{ title: string; slug: string; status: string; blocks: Block[] }>
) {
  return serverApi.put<ClientPage>(`/clients/${clientId}/pages/${pageId}`, data);
}

export async function deleteClientPage(clientId: string, pageId: string) {
  return serverApi.delete(`/clients/${clientId}/pages/${pageId}`);
}

// ── Client Layouts ─────────────────────────────────────────────────────────

export async function getLayout(slug: string) {
  return serverApi.get<BlockLayout>(`/layouts/${slug}`);
}

export async function upsertLayout(slug: string, blocks: Block[]) {
  return serverApi.put(`/layouts/${slug}`, { blocks });
}

// ── Media ──────────────────────────────────────────────────────────────────

export async function getMediaLibrary() {
  return serverApi.get<MediaEntry[]>(`/media/library`);
}

export async function updateMedia(
  id: string,
  data: { title: string; caption?: string; altText?: string }
) {
  return serverApi.patch<MediaEntry>(`/media/${id}`, data);
}

export async function deleteMedia(id: string) {
  return serverApi.delete(`/media/${id}`);
}

// Note: uploadMedia needs FormData, so it stays in utils for now
// It's called from client components but that's acceptable for file uploads

// ── Logs ───────────────────────────────────────────────────────────────────

export async function getLogs(query: {
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const params = new URLSearchParams();
  if (query.tags?.length) params.append('tags', query.tags.join(','));
  if (query.search) params.append('search', query.search);
  if (query.limit) params.append('limit', String(query.limit));
  if (query.offset) params.append('offset', String(query.offset));

  return serverApi.get<{ entries: LogEntry[]; total: number }>(`/logs?${params}`);
}

export async function getLogTags() {
  return serverApi.get<string[]>(`/logs/tags`);
}

export async function clearLogs() {
  return serverApi.delete(`/logs`);
}

// ── Webhooks ───────────────────────────────────────────────────────────────

export async function getAllWebhooks() {
  return serverApi.get<Webhook[]>(`/webhooks`);
}

export async function getWebhook(id: string) {
  return serverApi.get<Webhook>(`/webhooks/${id}`);
}

export async function createWebhook(data: Omit<Webhook, '_id' | 'successCount' | 'failureCount' | 'lastTriggeredAt' | 'lastError' | 'createdAt'>) {
  return serverApi.post<Webhook>(`/webhooks`, data);
}

export async function updateWebhook(id: string, data: Partial<Webhook>) {
  return serverApi.put<Webhook>(`/webhooks/${id}`, data);
}

export async function deleteWebhook(id: string) {
  return serverApi.delete(`/webhooks/${id}`);
}

export async function testWebhook(id: string) {
  return serverApi.post<{ success: boolean; statusCode?: number; error?: string }>(`/webhooks/${id}/test`, {});
}

// ── Users ──────────────────────────────────────────────────────────────────

interface UserEntry {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt?: string;
}

export async function getUsers() {
  return serverApi.get<UserEntry[]>(`/auth/users`);
}

export async function updateUserRole(userId: string, role: string) {
  return serverApi.patch<{ role: string }>(`/auth/users/${userId}`, { role });
}
