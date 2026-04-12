import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, UseGuards } from '@nestjs/common';
import { WebhooksService, WebhookData } from './webhooks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/schemas/user.schema';

@Controller('webhooks')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  findAll() {
    return this.webhooksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.webhooksService.findOne(id);
  }

  @Post()
  create(@Body() body: WebhookData) {
    return this.webhooksService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<WebhookData>) {
    return this.webhooksService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  delete(@Param('id') id: string) {
    return this.webhooksService.delete(id);
  }

  @Post(':id/test')
  test(@Param('id') id: string) {
    return this.webhooksService.test(id);
  }
}
