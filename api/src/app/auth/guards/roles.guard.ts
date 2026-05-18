import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../auth.service';
import { UserRole } from '../schemas/user.schema';

interface AuthenticatedRequest {
  userId?: string;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<UserRole[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.userId;

    if (!userId) {
      return false;
    }

    try {
      const user = await this.authService.getUserById(userId);
      return requiredRoles.includes(user.role as UserRole);
    } catch {
      return false;
    }
  }
}
