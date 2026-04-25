import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Query,
  UseGuards,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import {
  SettingScope,
  SettingSchemaView,
} from '@research-cms/shared-types';
import { SettingsService, SettingTarget } from './settings.service';
import { SessionGuard } from '../auth/guards/session.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/schemas/user.schema';

const VALID_SCOPES: SettingScope[] = ['global', 'client', 'schema', 'page'];
const VALID_VIEWS: SettingSchemaView[] = ['single', 'archive', 'both'];

function parseTarget(query: Record<string, string>): SettingTarget {
  const scope = query.scope as SettingScope;
  if (!VALID_SCOPES.includes(scope)) {
    throw new BadRequestException(`Invalid scope "${query.scope}"`);
  }
  const schemaView = query.schemaView as SettingSchemaView | undefined;
  if (schemaView && !VALID_VIEWS.includes(schemaView)) {
    throw new BadRequestException(`Invalid schemaView "${schemaView}"`);
  }
  return {
    scope,
    scopeId: query.scopeId || undefined,
    schemaView,
  };
}

interface UpsertBody {
  scope: SettingScope;
  scopeId?: string;
  schemaView?: SettingSchemaView;
  key: string;
  value: unknown;
}

@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  /** Public flat map — no auth. Only `isPublic` definitions are returned. */
  @Get('public')
  publicMap(@Query() query: Record<string, string>) {
    return this.settings.listPublic(parseTarget(query));
  }

  /** Admin: list definitions + current values for a scope. */
  @Get()
  @UseGuards(SessionGuard)
  list(@Query() query: Record<string, string>) {
    return this.settings.list(parseTarget(query));
  }

  /** Admin: upsert one setting value. */
  @Put()
  @UseGuards(SessionGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(204)
  async upsert(@Body() body: UpsertBody) {
    if (!body?.key) throw new BadRequestException('key is required');
    await this.settings.upsert(
      { scope: body.scope, scopeId: body.scopeId, schemaView: body.schemaView },
      body.key,
      body.value,
    );
  }

  /** Admin: delete one setting (revert to default). */
  @Delete()
  @UseGuards(SessionGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(204)
  async clear(@Body() body: UpsertBody) {
    if (!body?.key) throw new BadRequestException('key is required');
    await this.settings.clear(
      { scope: body.scope, scopeId: body.scopeId, schemaView: body.schemaView },
      body.key,
    );
  }
}
