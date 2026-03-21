import { Controller, Get, Post, Delete, Patch, Body, Param, HttpCode, UseGuards } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/schemas/user.schema';

@Controller('api-keys')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  findAll() {
    return this.apiKeysService.findAll();
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

  @Delete(':id')
  @HttpCode(204)
  delete(@Param('id') id: string) {
    return this.apiKeysService.delete(id);
  }
}
