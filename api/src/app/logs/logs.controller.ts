import { Controller, Get, Delete, Query, HttpCode, UseGuards } from '@nestjs/common';
import { LogsService } from './logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/schemas/user.schema';

@Controller('logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  findAll(
    @Query('tags') tags?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.logsService.findAll({
      tags: tags ? tags.split(',').filter(Boolean) : undefined,
      search: search || undefined,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  @Get('tags')
  distinctTags() {
    return this.logsService.distinctTags();
  }

  @Delete()
  @HttpCode(204)
  clear() {
    return this.logsService.clear();
  }
}
