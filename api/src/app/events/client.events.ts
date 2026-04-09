export class ClientCreatedEvent {
  constructor(
    public readonly clientId: string,
    public readonly name: string,
  ) {}
}

export class ClientUpdatedEvent {
  constructor(
    public readonly clientId: string,
    public readonly name: string,
  ) {}
}

export class ApiKeyUsedEvent {
  constructor(
    public readonly keyId: string,
    public readonly schemaSlug: string,
    public readonly endpoint: string,
    public readonly timestamp: string,
  ) {}
}
