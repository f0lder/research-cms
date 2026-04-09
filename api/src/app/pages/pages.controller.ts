import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, UseGuards } from '@nestjs/common';
import { PagesService, PageData } from './pages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/schemas/user.schema';

@Controller('clients/:clientId/pages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get()
  findAll(@Param('clientId') clientId: string) {
    return this.pagesService.findAllForClient(clientId);
  }

  @Get(':pageId')
  findOne(
    @Param('clientId') clientId: string,
    @Param('pageId') pageId: string,
  ) {
    return this.pagesService.findOne(clientId, pageId);
  }

  @Post()
  create(
    @Param('clientId') clientId: string,
    @Body() body: PageData,
  ) {
    return this.pagesService.create(clientId, body);
  }

  @Put(':pageId')
  update(
    @Param('clientId') clientId: string,
    @Param('pageId') pageId: string,
    @Body() body: Partial<PageData>,
  ) {
    return this.pagesService.update(clientId, pageId, body);
  }

  @Delete(':pageId')
  @HttpCode(204)
  delete(
    @Param('clientId') clientId: string,
    @Param('pageId') pageId: string,
  ) {
    return this.pagesService.delete(clientId, pageId);
  }
}
