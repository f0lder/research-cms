import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { PublicService } from './public.service';
import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';
import { BlockDefinition } from '@research-cms/shared-types';

type PublicRequest = Request & {
  apiKeyAllowedSchemas: string[];
  clientLayouts: Map<string, BlockDefinition[]>;
};

@Controller('public')
@UseGuards(ApiKeyGuard)
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get()
  listSchemas(@Req() req: PublicRequest) {
    return this.publicService.listSchemas(req.apiKeyAllowedSchemas);
  }

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
      req.clientLayouts ?? new Map(),
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
      req.clientLayouts ?? new Map(),
    );
  }
}
