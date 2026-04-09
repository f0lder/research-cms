import { Controller, Get, Post, Delete, Patch, Put, Body, Param, HttpCode, UseGuards } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/schemas/user.schema';
import { Block } from '@research-cms/shared-types';

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

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

  @Put(':id/home-page')
  setHomePage(
    @Param('id') id: string,
    @Body() body: { pageId: string | null },
  ) {
    return this.apiKeysService.setHomePage(id, body.pageId);
  }

  @Put(':id/layouts/:schemaSlug')
  upsertLayout(
    @Param('id') id: string,
    @Param('schemaSlug') schemaSlug: string,
    @Body() body: { blocks: Block[] },
  ) {
    return this.apiKeysService.upsertLayout(id, schemaSlug, body.blocks);
  }

  @Delete(':id')
  @HttpCode(204)
  delete(@Param('id') id: string) {
    return this.apiKeysService.delete(id);
  }
}
