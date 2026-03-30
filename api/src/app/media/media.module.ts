import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MediaController } from './media.controller';
import { MediaSeedService } from './media-seed.service';
import { StorageService } from './storage.interface';
import { LocalStorageService } from './local-storage.service';
import { ContentModule } from '../content/content.module';
import { ContentType, ContentTypeSchema } from '../schema/schemas/content-type.schema';

/**
 * To swap to R2/S3:
 *  1. Create R2StorageService extends StorageService
 *  2. Change useClass below to R2StorageService
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: ContentType.name, schema: ContentTypeSchema }]),
    ContentModule,
  ],
  controllers: [MediaController],
  providers: [
    MediaSeedService,
    { provide: StorageService, useClass: LocalStorageService },
  ],
  exports: [StorageService],
})
export class MediaModule {}
