import { Injectable } from '@nestjs/common';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join, extname } from 'path';
import { randomBytes } from 'crypto';
import { StorageService, StorageResult } from './storage.interface';

@Injectable()
export class LocalStorageService extends StorageService {
  private readonly uploadDir = join(process.cwd(), 'uploads');
  private readonly baseUrl = process.env.API_URL ?? 'http://localhost:3000';

  async upload(file: Express.Multer.File): Promise<StorageResult> {
    await mkdir(this.uploadDir, { recursive: true });

    const ext = extname(file.originalname).toLowerCase();
    const key = `${Date.now()}-${randomBytes(8).toString('hex')}${ext}`;

    await writeFile(join(this.uploadDir, key), file.buffer);

    return {
      key,
      url: `${this.baseUrl}/uploads/${key}`,
      size: file.size,
      mimeType: file.mimetype,
      originalName: file.originalname,
    };
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(join(this.uploadDir, key));
    } catch {
      // File already gone — that's fine
    }
  }
}
