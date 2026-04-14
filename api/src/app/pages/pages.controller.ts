import { Controller, Get, Delete, Param, HttpCode, UseGuards } from '@nestjs/common';
import { PagesService } from './pages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/schemas/user.schema';
import { ContentEntry } from '@research-cms/shared-types';

@Controller('clients/:clientId/pages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get()
  findAll(@Param('clientId') clientId: string): Promise<ContentEntry[]> {
    return this.pagesService.findAllForClient(clientId);
  }

  @Get(':pageId')
  findOne(
    @Param('clientId') clientId: string,
    @Param('pageId') pageId: string,
  ): Promise<ContentEntry> {
    return this.pagesService.findOne(clientId, pageId);
  }

  @Delete(':pageId')
  @HttpCode(204)
  delete(
    @Param('clientId') clientId: string,
    @Param('pageId') pageId: string,
  ): Promise<void> {
    return this.pagesService.delete(clientId, pageId);
  }
}
