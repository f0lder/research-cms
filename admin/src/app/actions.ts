'use server';

import { serverApi } from '@/lib/server-api';
import {
  ContentTypeDefinition,
  ContentEntry,
  Client,
  MediaEntry,
  LogEntry,
  FieldDefinition,
  FieldValue,
  Block,
  Webhook,
  Menu,
  MenuItem,
  PAGE_SCHEMA_SLUG,
  SettingDefinition,
  SettingScope,
  SettingSchemaView,
} from '@research-cms/shared-types';

// ── Schemas ────────────────────────────────────────────────────────────────

export async function getSchema(slug: string) {
  return serverApi.get<ContentTypeDefinition>(`/schemas/${slug}`);
}

export async function getSchemaById(id: string) {
  return serverApi.get<ContentTypeDefinition>(`/schemas/id/${id}`);
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
  singularName?: string;
  pluralName?: string;
  description?: string;
  fields: FieldDefinition[];
  features?: { drafts?: boolean; revisions?: boolean; search?: boolean; seo?: boolean };
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

export async function bulkDeleteEntries(slug: string, ids: string[]) {
	return serverApi.delete(`/content/${slug}/bulk`, { ids });
}

export async function rebuildIndex(slug: string) {
	return serverApi.post<{ message: string; docsCount: number }>(`/content/${slug}/rebuild-index`, {});
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

export type ClientTemplate = 'none' | 'mobile' | 'web';

export async function createClientWithTemplate(name: string, template: ClientTemplate) {
  const { data: client, error } = await createClient(name);
  if (error || !client?._id) return { error };

  if (template === 'none') {
    return { data: client };
  }

  const clientId = client._id;

  interface PageTemplate {
    title: string;
    slug: string;
    isHome: boolean;
    blocks: Block[];
  }
  let pagesToCreate: PageTemplate[] = [];
  let theme: Record<string, string | number> = {};

  if (template === 'mobile') {
    pagesToCreate = [
      {
        title: 'Home',
        slug: 'home',
        isHome: true,
        blocks: [
          { id: crypto.randomUUID(), type: 'heading', level: 1, align: 'center', text: 'Welcome to your App', visible: true, order: 0 },
          { id: crypto.randomUUID(), type: 'spacer', height: 20, visible: true, order: 1 },
          { id: crypto.randomUUID(), type: 'card', elevation: 1, visible: true, order: 2, pressAction: { type: 'navigate', pageSlug: 'profile' }, blocks: [
            { id: crypto.randomUUID(), type: 'heading', level: 3, text: 'Getting Started', visible: true, order: 0 },
            { id: crypto.randomUUID(), type: 'text', content: 'Configure this app in your dashboard.', visible: true, order: 1 }
          ]},
          { id: crypto.randomUUID(), type: 'spacer', height: 20, visible: true, order: 3 },
          { id: crypto.randomUUID(), type: 'button', label: 'View Profile', align: 'center', variant: 'primary', action: { type: 'navigate', pageSlug: 'profile' }, visible: true, order: 4 },
          { id: crypto.randomUUID(), type: 'divider', visible: true, order: 5 }
        ]
      },
      {
        title: 'Profile',
        slug: 'profile',
        isHome: false,
        blocks: [
          { id: crypto.randomUUID(), type: 'heading', level: 2, align: 'left', text: 'User Profile', visible: true, order: 0 },
          { id: crypto.randomUUID(), type: 'text', align: 'left', content: 'Manage your settings and preferences.', visible: true, order: 1 },
          { id: crypto.randomUUID(), type: 'spacer', height: 32, visible: true, order: 2 },
          { id: crypto.randomUUID(), type: 'button', label: 'Back to Home', align: 'left', variant: 'ghost', action: { type: 'navigate', pageSlug: 'home' }, visible: true, order: 3 }
        ]
      },
      {
        title: 'Settings',
        slug: 'settings',
        isHome: false,
        blocks: [
          { id: crypto.randomUUID(), type: 'heading', level: 2, align: 'left', text: 'Settings', visible: true, order: 0 },
          { id: crypto.randomUUID(), type: 'text', align: 'left', content: 'Configure your experience and preferences.', visible: true, order: 1 },
          { id: crypto.randomUUID(), type: 'spacer', height: 24, visible: true, order: 2 },
          { id: crypto.randomUUID(), type: 'card', elevation: 1, visible: true, order: 3, blocks: [
            { id: crypto.randomUUID(), type: 'heading', level: 4, text: 'Notifications', visible: true, order: 0 },
            { id: crypto.randomUUID(), type: 'text', content: 'Push notifications, email alerts, and in-app reminders are managed in your device settings.', visible: true, order: 1 }
          ]},
          { id: crypto.randomUUID(), type: 'spacer', height: 12, visible: true, order: 4 },
          { id: crypto.randomUUID(), type: 'card', elevation: 1, visible: true, order: 5, blocks: [
            { id: crypto.randomUUID(), type: 'heading', level: 4, text: 'Appearance', visible: true, order: 0 },
            { id: crypto.randomUUID(), type: 'text', content: 'The app follows your system theme by default. Light and dark modes adapt automatically as your device switches.', visible: true, order: 1 }
          ]},
          { id: crypto.randomUUID(), type: 'spacer', height: 12, visible: true, order: 6 },
          { id: crypto.randomUUID(), type: 'card', elevation: 1, visible: true, order: 7, blocks: [
            { id: crypto.randomUUID(), type: 'heading', level: 4, text: 'Privacy', visible: true, order: 0 },
            { id: crypto.randomUUID(), type: 'text', content: 'Your data is yours. We never share personal information with third parties without your explicit consent.', visible: true, order: 1 }
          ]},
          { id: crypto.randomUUID(), type: 'spacer', height: 12, visible: true, order: 8 },
          { id: crypto.randomUUID(), type: 'card', elevation: 1, visible: true, order: 9, blocks: [
            { id: crypto.randomUUID(), type: 'heading', level: 4, text: 'About', visible: true, order: 0 },
            { id: crypto.randomUUID(), type: 'text', content: 'Version 1.0.0 — Built on a flexible content management system that adapts to whatever you need to ship.', visible: true, order: 1 }
          ]},
          { id: crypto.randomUUID(), type: 'spacer', height: 32, visible: true, order: 10 },
          { id: crypto.randomUUID(), type: 'button', label: 'Back to Home', align: 'left', variant: 'ghost', action: { type: 'navigate', pageSlug: 'home' }, visible: true, order: 11 }
        ]
      },
      {
        title: 'Notifications',
        slug: 'notifications',
        isHome: false,
        blocks: [
          { id: crypto.randomUUID(), type: 'heading', level: 2, align: 'left', text: 'Notifications', visible: true, order: 0 },
          { id: crypto.randomUUID(), type: 'text', align: 'left', content: 'Stay updated with the latest activity and announcements.', visible: true, order: 1 },
          { id: crypto.randomUUID(), type: 'spacer', height: 24, visible: true, order: 2 },
          { id: crypto.randomUUID(), type: 'card', elevation: 1, visible: true, order: 3, blocks: [
            { id: crypto.randomUUID(), type: 'heading', level: 4, text: 'Welcome aboard', visible: true, order: 0 },
            { id: crypto.randomUUID(), type: 'text', content: 'Thanks for installing the app. Take a moment to explore your profile and customize your settings to fit how you work.', visible: true, order: 1 }
          ]},
          { id: crypto.randomUUID(), type: 'spacer', height: 12, visible: true, order: 4 },
          { id: crypto.randomUUID(), type: 'card', elevation: 1, visible: true, order: 5, blocks: [
            { id: crypto.randomUUID(), type: 'heading', level: 4, text: 'New feature available', visible: true, order: 0 },
            { id: crypto.randomUUID(), type: 'text', content: 'Pages and content are now powered by a flexible block system. Compose rich layouts without writing a single line of code.', visible: true, order: 1 }
          ]},
          { id: crypto.randomUUID(), type: 'spacer', height: 12, visible: true, order: 6 },
          { id: crypto.randomUUID(), type: 'card', elevation: 1, visible: true, order: 7, blocks: [
            { id: crypto.randomUUID(), type: 'heading', level: 4, text: 'Tip of the day', visible: true, order: 0 },
            { id: crypto.randomUUID(), type: 'text', content: 'Visit the dashboard to manage your content, customize the theme, and publish new pages on the fly.', visible: true, order: 1 }
          ]},
          { id: crypto.randomUUID(), type: 'spacer', height: 32, visible: true, order: 8 },
          { id: crypto.randomUUID(), type: 'button', label: 'Back to Home', align: 'left', variant: 'ghost', action: { type: 'navigate', pageSlug: 'home' }, visible: true, order: 9 }
        ]
      }
    ];
    theme = {
      'client.theme.primaryColor': '#8B5CF6',
      'client.theme.secondaryColor': '#EC4899',
      'client.theme.backgroundColor': '#F8FAFC',
      'client.theme.textColor': '#0F172A',
      'client.theme.borderRadius': 16,
    };
  } else if (template === 'web') {
    pagesToCreate = [
      {
        title: 'Home',
        slug: 'home',
        isHome: true,
        blocks: [
          { id: crypto.randomUUID(), type: 'heading', level: 1, align: 'center', text: 'Welcome to Your Web App', visible: true, order: 0 },
          { id: crypto.randomUUID(), type: 'text', align: 'center', content: 'Build powerful digital experiences.', visible: true, order: 1 },
          { id: crypto.randomUUID(), type: 'spacer', height: 40, visible: true, order: 2 },
          { id: crypto.randomUUID(), type: 'row', visible: true, order: 3, columns: [
            { id: crypto.randomUUID(), type: 'column', visible: true, order: 0, width: 'auto', blocks: [
              { id: crypto.randomUUID(), type: 'card', elevation: 1, visible: true, order: 0, blocks: [
                { id: crypto.randomUUID(), type: 'heading', level: 3, text: 'Fast', visible: true, order: 0 },
                { id: crypto.randomUUID(), type: 'text', content: 'Blazing fast load times.', visible: true, order: 1 }
              ]}
            ]},
            { id: crypto.randomUUID(), type: 'column', visible: true, order: 1, width: 'auto', blocks: [
              { id: crypto.randomUUID(), type: 'card', elevation: 1, visible: true, order: 0, blocks: [
                { id: crypto.randomUUID(), type: 'heading', level: 3, text: 'Secure', visible: true, order: 0 },
                { id: crypto.randomUUID(), type: 'text', content: 'Enterprise grade security.', visible: true, order: 1 }
              ]}
            ]},
            { id: crypto.randomUUID(), type: 'column', visible: true, order: 2, width: 'auto', blocks: [
              { id: crypto.randomUUID(), type: 'card', elevation: 1, visible: true, order: 0, blocks: [
                { id: crypto.randomUUID(), type: 'heading', level: 3, text: 'Scalable', visible: true, order: 0 },
                { id: crypto.randomUUID(), type: 'text', content: 'Grows with your business.', visible: true, order: 1 }
              ]}
            ]}
          ]},
          { id: crypto.randomUUID(), type: 'spacer', height: 40, visible: true, order: 4 },
          { id: crypto.randomUUID(), type: 'button', label: 'Learn More', align: 'center', variant: 'primary', action: { type: 'navigate', pageSlug: 'about' }, visible: true, order: 5 }
        ]
      },
      {
        title: 'About Us',
        slug: 'about',
        isHome: false,
        blocks: [
          { id: crypto.randomUUID(), type: 'heading', level: 1, align: 'left', text: 'Our Story', visible: true, order: 0 },
          { id: crypto.randomUUID(), type: 'divider', visible: true, order: 1 },
          { id: crypto.randomUUID(), type: 'spacer', height: 20, visible: true, order: 2 },
          { id: crypto.randomUUID(), type: 'row', visible: true, order: 3, columns: [
            { id: crypto.randomUUID(), type: 'column', visible: true, order: 0, width: 'auto', blocks: [
              { id: crypto.randomUUID(), type: 'text', align: 'left', content: 'We are dedicated to building the best web applications. Our team of experts works tirelessly to deliver top-notch solutions.', visible: true, order: 0 }
            ]},
            { id: crypto.randomUUID(), type: 'column', visible: true, order: 1, width: 'auto', blocks: [
              { id: crypto.randomUUID(), type: 'card', elevation: 1, visible: true, order: 0, pressAction: { type: 'url', url: 'mailto:contact@example.com' }, blocks: [
                { id: crypto.randomUUID(), type: 'heading', level: 3, text: 'Contact', visible: true, order: 0 },
                { id: crypto.randomUUID(), type: 'text', content: 'Reach us at contact@example.com', visible: true, order: 1 }
              ]}
            ]}
          ]}
        ]
      },
      {
        title: 'Services',
        slug: 'services',
        isHome: false,
        blocks: [
          { id: crypto.randomUUID(), type: 'heading', level: 1, align: 'center', text: 'Our Services', visible: true, order: 0 },
          { id: crypto.randomUUID(), type: 'text', align: 'center', content: 'Comprehensive solutions designed to help your business thrive in a digital-first world.', visible: true, order: 1 },
          { id: crypto.randomUUID(), type: 'spacer', height: 40, visible: true, order: 2 },
          { id: crypto.randomUUID(), type: 'row', visible: true, order: 3, columns: [
            { id: crypto.randomUUID(), type: 'column', visible: true, order: 0, width: 'auto', blocks: [
              { id: crypto.randomUUID(), type: 'card', elevation: 1, visible: true, order: 0, blocks: [
                { id: crypto.randomUUID(), type: 'heading', level: 3, text: 'Strategy', visible: true, order: 0 },
                { id: crypto.randomUUID(), type: 'text', content: 'We work with you to define a clear roadmap, identify priorities, and align technology with business goals. Every engagement starts with understanding what success looks like.', visible: true, order: 1 }
              ]}
            ]},
            { id: crypto.randomUUID(), type: 'column', visible: true, order: 1, width: 'auto', blocks: [
              { id: crypto.randomUUID(), type: 'card', elevation: 1, visible: true, order: 0, blocks: [
                { id: crypto.randomUUID(), type: 'heading', level: 3, text: 'Development', visible: true, order: 0 },
                { id: crypto.randomUUID(), type: 'text', content: 'From idea to launch, we build performant, accessible, and maintainable products. Our process is iterative and transparent so you always know where things stand.', visible: true, order: 1 }
              ]}
            ]},
            { id: crypto.randomUUID(), type: 'column', visible: true, order: 2, width: 'auto', blocks: [
              { id: crypto.randomUUID(), type: 'card', elevation: 1, visible: true, order: 0, blocks: [
                { id: crypto.randomUUID(), type: 'heading', level: 3, text: 'Support', visible: true, order: 0 },
                { id: crypto.randomUUID(), type: 'text', content: 'Software is never finished. Our ongoing support keeps your product secure, up to date, and evolving alongside your users and your industry.', visible: true, order: 1 }
              ]}
            ]}
          ]},
          { id: crypto.randomUUID(), type: 'spacer', height: 40, visible: true, order: 4 },
          { id: crypto.randomUUID(), type: 'divider', visible: true, order: 5 },
          { id: crypto.randomUUID(), type: 'spacer', height: 32, visible: true, order: 6 },
          { id: crypto.randomUUID(), type: 'heading', level: 2, align: 'left', text: 'How we work', visible: true, order: 7 },
          { id: crypto.randomUUID(), type: 'text', align: 'left', content: 'Every project follows a simple, repeatable process refined over years of practice. We start with discovery — listening to your team, mapping the problem, and agreeing on the outcomes that matter. We move into design and build in short cycles, releasing real, working software every couple of weeks. We finish with handoff and care: training, documentation, and the long tail of support that keeps a product alive.', visible: true, order: 8 },
          { id: crypto.randomUUID(), type: 'spacer', height: 32, visible: true, order: 9 },
          { id: crypto.randomUUID(), type: 'button', label: 'Back to Home', align: 'left', variant: 'ghost', action: { type: 'navigate', pageSlug: 'home' }, visible: true, order: 10 }
        ]
      },
      {
        title: 'Contact',
        slug: 'contact',
        isHome: false,
        blocks: [
          { id: crypto.randomUUID(), type: 'heading', level: 1, align: 'center', text: 'Get in Touch', visible: true, order: 0 },
          { id: crypto.randomUUID(), type: 'text', align: 'center', content: 'We respond to every message within one business day.', visible: true, order: 1 },
          { id: crypto.randomUUID(), type: 'spacer', height: 40, visible: true, order: 2 },
          { id: crypto.randomUUID(), type: 'row', visible: true, order: 3, columns: [
            { id: crypto.randomUUID(), type: 'column', visible: true, order: 0, width: 'auto', blocks: [
              { id: crypto.randomUUID(), type: 'card', elevation: 1, visible: true, order: 0, blocks: [
                { id: crypto.randomUUID(), type: 'heading', level: 3, text: 'Email', visible: true, order: 0 },
                { id: crypto.randomUUID(), type: 'text', content: 'For general inquiries, write to hello@example.com. For support, support@example.com is monitored on weekdays.', visible: true, order: 1 }
              ]},
              { id: crypto.randomUUID(), type: 'spacer', height: 16, visible: true, order: 1 },
              { id: crypto.randomUUID(), type: 'card', elevation: 1, visible: true, order: 2, blocks: [
                { id: crypto.randomUUID(), type: 'heading', level: 3, text: 'Phone', visible: true, order: 0 },
                { id: crypto.randomUUID(), type: 'text', content: 'Call +1 (555) 123-4567 between 9am and 6pm in your local time zone.', visible: true, order: 1 }
              ]}
            ]},
            { id: crypto.randomUUID(), type: 'column', visible: true, order: 1, width: 'auto', blocks: [
              { id: crypto.randomUUID(), type: 'card', elevation: 1, visible: true, order: 0, blocks: [
                { id: crypto.randomUUID(), type: 'heading', level: 3, text: 'Office', visible: true, order: 0 },
                { id: crypto.randomUUID(), type: 'text', content: '123 Example Avenue, Suite 400\nAnytown, ST 12345\nUnited States', visible: true, order: 1 }
              ]},
              { id: crypto.randomUUID(), type: 'spacer', height: 16, visible: true, order: 1 },
              { id: crypto.randomUUID(), type: 'card', elevation: 1, visible: true, order: 2, blocks: [
                { id: crypto.randomUUID(), type: 'heading', level: 3, text: 'Hours', visible: true, order: 0 },
                { id: crypto.randomUUID(), type: 'text', content: 'Monday through Friday\n9:00am — 6:00pm\nClosed on weekends and public holidays', visible: true, order: 1 }
              ]}
            ]}
          ]},
          { id: crypto.randomUUID(), type: 'spacer', height: 40, visible: true, order: 4 },
          { id: crypto.randomUUID(), type: 'divider', visible: true, order: 5 },
          { id: crypto.randomUUID(), type: 'spacer', height: 24, visible: true, order: 6 },
          { id: crypto.randomUUID(), type: 'text', align: 'center', content: 'Prefer to write to us? Use any of the channels above. We read every message.', visible: true, order: 7 },
          { id: crypto.randomUUID(), type: 'spacer', height: 32, visible: true, order: 8 },
          { id: crypto.randomUUID(), type: 'button', label: 'Back to Home', align: 'center', variant: 'ghost', action: { type: 'navigate', pageSlug: 'home' }, visible: true, order: 9 }
        ]
      }
    ];
    theme = {
      'client.theme.primaryColor': '#2563EB',
      'client.theme.secondaryColor': '#475569',
      'client.theme.backgroundColor': '#FFFFFF',
      'client.theme.textColor': '#1E293B',
      'client.theme.borderRadius': 4,
    };
  }

  // Create the page entries
  for (const pageConfig of pagesToCreate) {
    const { data: page } = await createEntry(PAGE_SCHEMA_SLUG, {
      clientId,
      title: pageConfig.title,
      slug: pageConfig.slug,
      blocks: pageConfig.blocks
    });

    if (page?._id) {
      await bulkUpdateStatus(PAGE_SCHEMA_SLUG, [page._id], 'published');
      if (pageConfig.isHome) {
        await updateSetting({ scope: 'client', scopeId: clientId }, 'client.homePage', page._id);
      }
    }
  }

  // Set the theme settings
  for (const [key, value] of Object.entries(theme)) {
    await updateSetting({ scope: 'client', scopeId: clientId }, key, value);
  }

  return { data: client };
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

export async function getClientUsage(id: string, days = 30) {
  return serverApi.get<{ date: string; userCount: number; users: string[]; schemas: Record<string, number> }[]>(
    `/clients/${id}/usage?days=${days}`
  );
}

export async function clearClientUsage(id: string) {
  return serverApi.delete(`/clients/${id}/usage`);
}

// ── Client Pages ───────────────────────────────────────────────────────────
// Pages are now entries in the "page" schema. See PAGE_SCHEMA_SLUG in shared-types.
// Use standard content functions: getEntry(), createEntry(), updateEntry(), deleteEntry()

export async function getPageBySlug(clientId: string, pageSlug: string) {
  const allPages = await getAllEntries(PAGE_SCHEMA_SLUG);
  if (allPages.error) return { error: allPages.error };

  const page = allPages.data?.items?.find(
    p => p.data?.clientId === clientId && p.data?.slug === pageSlug
  );

  return page ? { data: page } : { error: 'Page not found' };
}

// ── Client Layouts ─────────────────────────────────────────────────────────

export async function getClientLayout(clientId: string, schemaSlug: string) {
  const schema = await getSchema(schemaSlug);
  if (schema.error || !schema.data) {
    return { error: schema.error || 'Schema not found'};
  }
  return serverApi.get<{ schemaId: string; schemaSlug: string; blocks: Block[] }>(`/clients/${clientId}/layouts/${schemaSlug}`);
}

export async function updateClientLayout(clientId: string, schemaSlug: string, blocks: Block[]) {
  const schema = await getSchema(schemaSlug);
  if (schema.error || !schema.data) {
    return { error: schema.error || 'Schema not found'};
  }
  return serverApi.put(`/clients/${clientId}/layouts/${schemaSlug}`, { blocks });
}

// ── Menus ──────────────────────────────────────────────────────────────────

export async function getClientMenus(clientId: string) {
  return serverApi.get<Menu[]>(`/clients/${clientId}/menus`);
}

export async function getClientMenu(clientId: string, menuId: string) {
  return serverApi.get<Menu>(`/clients/${clientId}/menus/${menuId}`);
}

export async function createClientMenu(clientId: string, data: { name: string; slug: string; slot?: string }) {
  return serverApi.post<Menu>(`/clients/${clientId}/menus`, data);
}

export async function updateClientMenu(clientId: string, menuId: string, data: Partial<Menu>) {
  return serverApi.patch<Menu>(`/clients/${clientId}/menus/${menuId}`, data);
}

export async function deleteClientMenu(clientId: string, menuId: string) {
  return serverApi.delete(`/clients/${clientId}/menus/${menuId}`);
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

// ── Settings ────────────────────────────────────────────────────────────────

export interface SettingItem {
  definition: SettingDefinition;
  value: unknown;
}

interface SettingTargetParams {
  scope: SettingScope;
  scopeId?: string;
  schemaView?: SettingSchemaView;
}

function settingsQuery(target: SettingTargetParams): string {
  const params = new URLSearchParams({ scope: target.scope });
  if (target.scopeId) params.set('scopeId', target.scopeId);
  if (target.schemaView) params.set('schemaView', target.schemaView);
  return params.toString();
}

export async function getSettings(target: SettingTargetParams) {
  return serverApi.get<SettingItem[]>(`/settings?${settingsQuery(target)}`);
}

export async function updateSetting(
  target: SettingTargetParams,
  key: string,
  value: unknown,
) {
  return serverApi.put(`/settings`, { ...target, key, value });
}

export async function clearSetting(target: SettingTargetParams, key: string) {
  return serverApi.delete(`/settings`, { ...target, key });
}

/**
 * Read a single setting's value (with default fallback).
 * Returns `undefined` if the key is unknown for that scope.
 */
export async function getSettingValue<T = unknown>(
  target: SettingTargetParams,
  key: string,
): Promise<{ data?: T; error?: string }> {
  const { data, error } = await getSettings(target);
  if (error) return { error };
  const item = data?.find(it => it.definition.key === key);
  if (!item) return { data: undefined };
  return { data: item.value as T };
}

/**
 * Flat public-settings map (`{ key: value }`) for the given target.
 * No auth required on the underlying endpoint.
 */
export async function getPublicSettings(target: SettingTargetParams) {
  return serverApi.get<Record<string, unknown>>(
    `/settings/public?${settingsQuery(target)}`,
  );
}
