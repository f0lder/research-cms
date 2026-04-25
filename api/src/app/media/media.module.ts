import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { StorageService } from './storage.interface';
import { LocalStorageService } from './local-storage.service';
import { ContentModule } from '../content/content.module';
import { AuthModule } from '../auth/auth.module';

/**
 * To swap to R2/S3:
 *  1. Create R2StorageService extends StorageService
 *  2. Change useClass below to R2StorageService
 */
@Module({
  imports: [
    ContentModule,
    AuthModule,
  ],
  controllers: [MediaController],
  providers: [
    { provide: StorageService, useClass: LocalStorageService },
  ],
  exports: [StorageService],
})
export class MediaModule {}
