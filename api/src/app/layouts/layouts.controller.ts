import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { LayoutsService } from './layouts.service';
import { SchemaService } from '../schema/schema.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/schemas/user.schema';
import { BlockDefinition } from '@research-cms/shared-types';

@Controller('layouts')
@UseGuards(JwtAuthGuard)
export class LayoutsController {
  constructor(
    private readonly layoutsService: LayoutsService,
    private readonly schemaService: SchemaService,
  ) {}

  /** Get layout for a schema. If none saved, returns a bootstrapped default. */
  @Get(':schemaSlug')
  async findOne(@Param('schemaSlug') schemaSlug: string) {
    const saved = await this.layoutsService.findOne(schemaSlug);
    if (saved) return saved;

    // No layout saved yet — derive from schema fields
    const schema = await this.schemaService.findOne(schemaSlug);
    return this.layoutsService.bootstrapFromSchema(schema);
  }

  /** Save (upsert) a layout. Admin only. */
  @Put(':schemaSlug')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  upsert(
    @Param('schemaSlug') schemaSlug: string,
    @Body() body: { blocks: BlockDefinition[] },
  ) {
    return this.layoutsService.upsert(schemaSlug, body.blocks);
  }
}
