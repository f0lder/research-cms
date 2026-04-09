export class ContentCreatedEvent {
  constructor(
    public readonly schemaSlug: string,
    public readonly entryId: string,
    public readonly data: Record<string, unknown>,
    public readonly triggeredBy: 'admin' | 'api' = 'admin',
  ) {}
}

export class ContentUpdatedEvent {
  constructor(
    public readonly schemaSlug: string,
    public readonly entryId: string,
    public readonly previousData: Record<string, unknown>,
    public readonly newData: Record<string, unknown>,
    public readonly triggeredBy: 'admin' | 'api' = 'admin',
  ) {}
}

export class ContentDeletedEvent {
  constructor(
    public readonly schemaSlug: string,
    public readonly entryId: string,
    public readonly triggeredBy: 'admin' | 'api' = 'admin',
  ) {}
}
