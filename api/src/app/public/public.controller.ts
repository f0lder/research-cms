import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { PublicService } from './public.service';
import { ApiKeysService } from '../api-keys/api-keys.service';
import { SchemaService } from '../schema/schema.service';
import { SettingsService } from '../settings/settings.service';
import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';
import { interpolateBlocks } from './interpolate';

type PublicRequest = Request & {
  clientId: string;
  apiKeyAllowedSchemas: string[];
};

@Controller('public')
@UseGuards(ApiKeyGuard)
export class PublicController {
  constructor(
    private readonly publicService: PublicService,
    private readonly apiKeysService: ApiKeysService,
    private readonly schemaService: SchemaService,
    private readonly settingsService: SettingsService,
  ) {}

  @Get()
  listSchemas(@Req() req: PublicRequest) {
    return this.publicService.listSchemas(req.apiKeyAllowedSchemas);
  }

  /** Public client-scoped settings, auto-resolved from the API key. */
  @Get('settings')
  async getClientSettings(@Req() req: PublicRequest) {
    return this.settingsService.listPublic({ scope: 'client', scopeId: req.clientId });
  }

  // ── Entry Layouts ────────────────────────────────────────────────────────────

  @Get('layouts/:schemaSlug')
  async getEntryLayout(
    @Param('schemaSlug') schemaSlug: string,
    @Req() req: PublicRequest,
  ) {
    // Convert slug to ObjectId
    const schema = await this.schemaService.findOne(schemaSlug);
    if (!schema) {
      return { blocks: [], schemaId: '', schemaSlug };
    }
    return this.apiKeysService.getLayout(req.clientId, String(schema._id));
  }

  @Get('layouts/:schemaSlug/render/:id')
  async renderEntryWithLayout(
    @Param('schemaSlug') schemaSlug: string,
    @Param('id') id: string,
    @Req() req: PublicRequest,
  ) {
    const schema = await this.schemaService.findOne(schemaSlug);
    if (!schema) {
      return { blocks: [], data: null };
    }

    const layout = await this.apiKeysService.getLayout(req.clientId, String(schema._id));
    const entry = await this.publicService.findOne(schemaSlug, id, req.apiKeyAllowedSchemas, req.clientId);

    const interpolatedBlocks = interpolateBlocks(layout.blocks, entry.data);

    return {
      blocks: interpolatedBlocks,
      data: entry.data,
      schemaSlug,
      entryId: entry._id,
    };
  }

  // ── Media ────────────────────────────────────────────────────────────────────

  @Get('media')
  async listMedia(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // List all published media files
    return this.publicService.findAll(
      'media',
      Number(page) || 1,
      Number(limit) || 50,
    );
  }

  @Get('media/:id')
  getMedia(
    @Param('id') id: string,
  ) {
    // Media is always publicly accessible (no allowedSchemas check)
    return this.publicService.findOne('media', id);
  }

  // ── Pages (client-scoped) ────────────────────────────────────────────────────

  @Get('page/by-slug/:slug')
  getPageBySlug(
    @Param('slug') slug: string,
    @Req() req: PublicRequest,
  ) {
    return this.publicService.findPageBySlug(slug, req.clientId);
  }

  // ── Schema content ───────────────────────────────────────────────────────────

  @Get(':schemaSlug')
  findAll(
    @Param('schemaSlug') schemaSlug: string,
    @Req() req: PublicRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.publicService.findAll(
      schemaSlug,
      Number(page) || 1,
      Number(limit) || 50,
      req.clientId,
    );
  }

  @Get(':schemaSlug/search')
  search(
    @Param('schemaSlug') schemaSlug: string,
    @Query('q') query?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.publicService.search(
      schemaSlug,
      query || '',
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Get(':schemaSlug/:id')
  findOne(
    @Param('schemaSlug') schemaSlug: string,
    @Param('id') id: string,
    @Req() req: PublicRequest,
  ) {
    return this.publicService.findOne(
      schemaSlug,
      id,
      req.apiKeyAllowedSchemas,
      req.clientId,
    );
  }
}
