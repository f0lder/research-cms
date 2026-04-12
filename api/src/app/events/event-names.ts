export const CmsEvents = {
  // Content
  CONTENT_CREATED: 'content.created',
  CONTENT_UPDATED: 'content.updated',
  CONTENT_DELETED: 'content.deleted',
  CONTENT_PUBLISHED: 'content.published',
  CONTENT_UNPUBLISHED: 'content.unpublished',
  // Schema
  SCHEMA_CREATED: 'schema.created',
  SCHEMA_UPDATED: 'schema.updated',
  SCHEMA_DELETED: 'schema.deleted',
  // Media
  MEDIA_UPLOADED: 'media.uploaded',
  MEDIA_DELETED:  'media.deleted',
  // Client / API key
  CLIENT_CREATED: 'client.created',
  CLIENT_UPDATED: 'client.updated',
  APIKEY_USED:    'apikey.used',
} as const;

export type CmsEventName = typeof CmsEvents[keyof typeof CmsEvents];
