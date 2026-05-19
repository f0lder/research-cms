import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, UseGuards } from '@nestjs/common';
import { MenusService } from './menus.service';
import { SessionGuard } from '../auth/guards/session.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/schemas/user.schema';

@Controller('clients/:clientId/menus')
@UseGuards(SessionGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Get()
  findAll(@Param('clientId') clientId: string) {
    return this.menusService.findAll(clientId);
  }

  @Get(':id')
  findOne(
    @Param('clientId') clientId: string,
    @Param('id') id: string,
  ) {
    return this.menusService.findOne(clientId, id);
  }

  @Post()
  create(
    @Param('clientId') clientId: string,
    @Body() body: { name: string; slug: string; slot?: string },
  ) {
    return this.menusService.create(clientId, { ...body, items: [] });
  }

  @Patch(':id')
  update(
    @Param('clientId') clientId: string,
    @Param('id') id: string,
    @Body() body: Partial<{ name: string; slug: string; slot: string; items: { id: string; label: string; type: 'page' | 'entry' | 'archive' | 'external'; pageSlug?: string; schemaSlug?: string; entryId?: string; archiveSchema?: string; url?: string; order: number }[] }>,
  ) {
    return this.menusService.update(clientId, id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  delete(
    @Param('clientId') clientId: string,
    @Param('id') id: string,
  ) {
    return this.menusService.delete(clientId, id);
  }
}
