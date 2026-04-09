export class SchemaCreatedEvent {
  constructor(
    public readonly slug: string,
    public readonly name: string,
  ) {}
}

export class SchemaUpdatedEvent {
  constructor(
    public readonly slug: string,
    /** Previous slug — equal to slug when not a rename. */
    public readonly previousSlug: string,
    public readonly name: string,
  ) {}
}

export class SchemaDeletedEvent {
  constructor(
    public readonly slug: string,
    public readonly name: string,
  ) {}
}
