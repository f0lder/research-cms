import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeysService } from '../api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const key = request.headers['x-api-key'];
    if (!key) throw new UnauthorizedException('Missing X-API-Key header');
    const valid = await this.apiKeysService.validateAndTrack(key);
    if (!valid) throw new UnauthorizedException('Invalid or inactive API key');
    return true;
  }
}
