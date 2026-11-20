import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@diety/types';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * RolesGuard
 * 
 * Enforces Role-Based Access Control (RBAC) across endpoints.
 * Verifies that the authenticated user possesses at least one of the declared required roles.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  public canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('Access denied: Authentication credentials required');
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied: Role '${user.role}' lacks required permissions [${requiredRoles.join(', ')}]`
      );
    }

    return true;
  }
}
