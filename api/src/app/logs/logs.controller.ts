import { Controller, Get, Delete, Query, HttpCode, UseGuards } from '@nestjs/common';
import { LogsService } from './logs.service';
import { SessionGuard } from '../auth/guards/session.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/schemas/user.schema';

@Controller('logs')
@UseGuards(SessionGuard, RolesGuard)
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

  @Get('activity-feed')
  getActivityFeed(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    return this.logsService.getActivityFeed(Number(limit) || 100, Number(offset) || 0);
  }

  @Get('activity')
  getActivity(
    @Query('limit') limit?: string,
    @Query('tag') tag?: string
  ) {
    if (tag) {
      return this.logsService.getActivityByTag(tag, Number(limit) || 50);
    }
    return this.logsService.getActivity(Number(limit) || 50);
  }

  @Delete()
  @HttpCode(204)
  clear() {
    return this.logsService.clear();
  }
}
