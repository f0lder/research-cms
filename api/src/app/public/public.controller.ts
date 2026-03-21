import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { PublicService } from './public.service';
import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';

@Controller('public')
@UseGuards(ApiKeyGuard)
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get()
  listSchemas(@Req() req: Request & { apiKeyAllowedSchemas: string[] }) {
    return this.publicService.listSchemas(req.apiKeyAllowedSchemas);
  }

  @Get(':schemaSlug')
  findAll(@Param('schemaSlug') schemaSlug: string) {
    return this.publicService.findAll(schemaSlug);
  }

  @Get(':schemaSlug/:id')
  findOne(
    @Param('schemaSlug') schemaSlug: string,
    @Param('id') id: string,
  ) {
    return this.publicService.findOne(schemaSlug, id);
  }
}
