import {
  Controller, Post, Delete, Patch, Get, Param, Body,
  UploadedFile, UseInterceptors, UseGuards,
  BadRequestException, HttpCode, Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StorageService } from './storage.interface';
import { ContentService } from '../content/content.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MEDIA_SCHEMA_SLUG, MediaEntry } from '@research-cms/shared-types';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(
    private readonly storage: StorageService,
    private readonly contentService: ContentService,
  ) {}

  /** Upload a file and create a media entry. Returns the full media entry. */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_BYTES },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('title') title?: string,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(`Unsupported type. Allowed: ${ALLOWED_TYPES.join(', ')}`);
    }

    const result = await this.storage.upload(file);

    const entry = await this.contentService.create(MEDIA_SCHEMA_SLUG, {
      title: title || file.originalname.replace(/\.[^.]+$/, ''),
      url: result.url,
      mimeType: result.mimeType,
      fileSize: result.size,
    });

    return this.toMediaEntry(entry);
  }

  /** List all media entries (for the picker). */
  @Get('library')
  async library() {
    const { items } = await this.contentService.findAll(MEDIA_SCHEMA_SLUG);
    return items.map(e => this.toMediaEntry(e));
  }

  /** Update title / caption / altText of a media entry. */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { title?: string; caption?: string; altText?: string },
  ) {
    const entry = await this.contentService.update(MEDIA_SCHEMA_SLUG, id, body as Record<string, string>);
    return this.toMediaEntry(entry);
  }

  /** Delete a media entry and its file. */
  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id') id: string) {
    const entry = await this.contentService.findOne(MEDIA_SCHEMA_SLUG, id);
    const url = String(entry.data.url ?? '');
    // Extract key from URL (last path segment)
    const key = url.split('/').pop();
    if (key && !key.includes('..')) await this.storage.delete(key);
    await this.contentService.delete(MEDIA_SCHEMA_SLUG, id);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toMediaEntry(entry: any): MediaEntry {
    return {
      _id: String(entry._id),
      title: String(entry.data.title ?? ''),
      url: String(entry.data.url ?? ''),
      caption: entry.data.caption ? String(entry.data.caption) : undefined,
      altText: entry.data.altText ? String(entry.data.altText) : undefined,
      mimeType: entry.data.mimeType ? String(entry.data.mimeType) : undefined,
      fileSize: entry.data.fileSize ? Number(entry.data.fileSize) : undefined,
      createdAt: entry.createdAt?.toISOString?.(),
    };
  }
}
