export interface StorageResult {
  key: string;
  url: string;
  size: number;
  mimeType: string;
  originalName: string;
}

/** Implement this to swap storage backends (local → R2, S3, etc.) */
export abstract class StorageService {
  abstract upload(file: Express.Multer.File): Promise<StorageResult>;
  abstract delete(key: string): Promise<void>;
}
