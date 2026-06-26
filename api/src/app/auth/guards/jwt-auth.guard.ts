import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthService } from '../auth.service';

interface EndUserRequest extends Request {
  userId?: string;
  clientId?: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<EndUserRequest>();
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    let payload: { sub: string; clientId: string };
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // A token minted for one project can't be replayed under another project's API key.
    if (payload.clientId !== request.clientId) {
      throw new UnauthorizedException('Token does not belong to this project');
    }

    await this.authService.validateEndUser(payload.sub, payload.clientId);
    request.userId = payload.sub;
    return true;
  }
}
