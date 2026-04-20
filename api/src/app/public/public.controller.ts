import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { PublicService } from './public.service';
import { ApiKeysService } from '../api-keys/api-keys.service';
import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';

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
  ) {}

  @Get()
  listSchemas(@Req() req: PublicRequest) {
    return this.publicService.listSchemas(req.apiKeyAllowedSchemas);
  }

  // ── Entry Layouts ────────────────────────────────────────────────────────────

  @Get('layouts/:schemaId')
  getEntryLayout(
    @Param('schemaId') schemaId: string,
    @Req() req: PublicRequest,
  ) {
    return this.apiKeysService.getLayout(req.clientId, schemaId);
  }

  // ── Media ────────────────────────────────────────────────────────────────────

  @Get('media/:id')
  getMedia(
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
    );
  }
}
