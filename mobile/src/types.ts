export type Schema = { slug: string; name: string };

export type Screen =
  | { name: 'list'; slug: string; schemaName: string }
  | { name: 'detail'; slug: string; schemaName: string; entryId: string };
