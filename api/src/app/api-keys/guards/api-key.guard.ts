import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { ApiKeysService } from '../api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const key = request.headers['x-api-key'];
    if (!key) throw new UnauthorizedException('Missing X-API-Key header');

    const doc = await this.apiKeysService.validateAndTrack(key);
    if (!doc) throw new UnauthorizedException('Invalid or inactive API key');

    // Attach scope and client-specific layouts to request
    request.apiKeyAllowedSchemas = doc.allowedSchemas;
    request.clientLayouts = new Map(
      (doc.layouts ?? []).map(l => [l.schemaSlug, l.blocks]),
    );

    // If allowedSchemas is non-empty, enforce schema-level access
    const schemaSlug: string | undefined = request.params?.schemaSlug;
    if (schemaSlug && doc.allowedSchemas.length > 0 && !doc.allowedSchemas.includes(schemaSlug)) {
      throw new ForbiddenException(`This key does not have access to "${schemaSlug}"`);
    }

    return true;
  }
}
