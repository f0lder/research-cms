import { Controller, Get, Post, Delete, Patch, Put, Body, Param, Query, HttpCode, UseGuards } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { ApiKeyUsageService } from './apikey-usage.service';
import { SchemaService } from '../schema/schema.service';
import { SessionGuard } from '../auth/guards/session.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/schemas/user.schema';
import { Block } from '@research-cms/shared-types';

@Controller('clients')
@UseGuards(SessionGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ApiKeysController {
  constructor(
    private readonly apiKeysService: ApiKeysService,
    private readonly apiKeyUsageService: ApiKeyUsageService,
    private readonly schemaService: SchemaService,
  ) {}

  @Get()
  findAll() {
    return this.apiKeysService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.apiKeysService.findOne(id);
  }

  @Post()
  create(@Body() body: { name: string }) {
    return this.apiKeysService.create(body.name);
  }

  @Patch(':id/schemas')
  updateAllowedSchemas(
    @Param('id') id: string,
    @Body() body: { allowedSchemas: string[] },
  ) {
    return this.apiKeysService.updateAllowedSchemas(id, body.allowedSchemas);
  }

  @Get(':id/usage')
  getUsage(
    @Param('id') id: string,
    @Query('days') days?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.apiKeyUsageService.getUsage(id, daysNum);
  }

  @Delete(':id/usage')
  @HttpCode(204)
  clearUsage(@Param('id') id: string) {
    return this.apiKeyUsageService.clearUsage(id);
  }

  @Get(':id/layouts/:schemaSlug')
  async getLayout(
    @Param('id') id: string,
    @Param('schemaSlug') schemaSlug: string,
  ) {
    const schema = await this.schemaService.findOne(schemaSlug);
    return this.apiKeysService.getLayout(id, String(schema._id));
  }

  @Put(':id/layouts/:schemaSlug')
  async upsertLayout(
    @Param('id') id: string,
    @Param('schemaSlug') schemaSlug: string,
    @Body() body: { blocks: Block[] },
  ) {
    const schema = await this.schemaService.findOne(schemaSlug);
    return this.apiKeysService.upsertLayout(id, String(schema._id), body.blocks);
  }

  @Delete(':id')
  @HttpCode(204)
  delete(@Param('id') id: string) {
    return this.apiKeysService.delete(id);
  }
}
