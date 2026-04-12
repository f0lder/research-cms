import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiKeysService } from '../api-keys.service';
import { CmsEvents, ApiKeyUsedEvent } from '../../events';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiKeysService: ApiKeysService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const key = request.headers['x-api-key'];
    if (!key) throw new UnauthorizedException('Missing X-API-Key header');

    const doc = await this.apiKeysService.validateAndTrack(key);
    if (!doc) throw new UnauthorizedException('Invalid or inactive API key');

    // Attach client identity, scope, layout overrides, and home page to request
    request.clientId = String(doc._id);
    request.homePageId = doc.homePage ?? null;
    request.apiKeyAllowedSchemas = doc.allowedSchemas;
    request.clientLayouts = new Map(
      (doc.layouts ?? []).map(l => [l.schemaSlug, l.blocks]),
    );

    // If allowedSchemas is non-empty, enforce schema-level access
    const schemaSlug: string | undefined = request.params?.schemaSlug;
    if (schemaSlug && doc.allowedSchemas.length > 0 && !doc.allowedSchemas.includes(schemaSlug)) {
      throw new ForbiddenException(`This key does not have access to "${schemaSlug}"`);
    }

    // Fire-and-forget — usage tracking must not delay the response
    const ipAddress = request.ip || request.socket?.remoteAddress || 'unknown';
    this.eventEmitter.emit(
      CmsEvents.APIKEY_USED,
      new ApiKeyUsedEvent(String(doc._id), schemaSlug ?? 'unknown', request.path, new Date().toISOString(), ipAddress),
    );

    return true;
  }
}
