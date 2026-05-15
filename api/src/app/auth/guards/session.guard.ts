import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { SessionService } from '../session.service';

interface AuthenticatedRequest extends Request {
  userId?: string;
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const sessionId = request.cookies?.session;

    if (!sessionId) {
      throw new UnauthorizedException('No session found');
    }

    const userId = await this.sessionService.validateSession(sessionId);
    if (!userId) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    request.userId = userId;
    return true;
  }
}
