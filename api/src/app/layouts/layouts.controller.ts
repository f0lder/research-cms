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

  /** Get layout for a schema, synced against the live schema fields. */
  @Get(':schemaSlug')
  async findOne(@Param('schemaSlug') schemaSlug: string) {
    const [schema, saved] = await Promise.all([
      this.schemaService.findOne(schemaSlug),
      this.layoutsService.findOne(schemaSlug),
    ]);
    const blocks = this.layoutsService.syncWithSchema(schema, saved?.blocks ?? null);
    return { schemaSlug, blocks };
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
