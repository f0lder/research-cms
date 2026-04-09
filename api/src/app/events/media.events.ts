export class MediaUploadedEvent {
  constructor(
    public readonly entryId: string,
    public readonly url: string,
    public readonly mimeType: string,
    public readonly fileSize: number,
  ) {}
}

export class MediaDeletedEvent {
  constructor(
    public readonly entryId: string,
    public readonly url: string,
  ) {}
}
