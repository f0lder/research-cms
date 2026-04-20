import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { PublicService } from './public.service';
import { LayoutsService } from '../layouts/layouts.service';
import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';

type PublicRequest = Request & {
  apiKeyAllowedSchemas: string[];
};

@Controller('public')
@UseGuards(ApiKeyGuard)
export class PublicController {
  constructor(
    private readonly publicService: PublicService,
    private readonly layoutsService: LayoutsService,
  ) {}

  @Get()
  listSchemas(@Req() req: PublicRequest) {
    return this.publicService.listSchemas(req.apiKeyAllowedSchemas);
  }

  // ── Entry Layouts ────────────────────────────────────────────────────────────

  @Get('layouts/:schemaSlug')
  async getEntryLayout(@Param('schemaSlug') schemaSlug: string) {
    const saved = await this.layoutsService.findOne(schemaSlug);
    return {
      schemaSlug,
      blocks: saved?.blocks ?? [],
    };
  }

  // ── Media ────────────────────────────────────────────────────────────────────

  @Get('media/:id')
  async getMedia(
    @Param('id') id: string,
    @Req() req: PublicRequest,
  ) {
    return this.publicService.findOne('media', id, req.apiKeyAllowedSchemas);
  }

  // ── Schema content ───────────────────────────────────────────────────────────

  @Get(':schemaSlug')
  findAll(
    @Param('schemaSlug') schemaSlug: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.publicService.findAll(
      schemaSlug,
      Number(page) || 1,
      Number(limit) || 50,
    );
  }

  @Get(':schemaSlug/search')
  async search(
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
    );
  }
}
