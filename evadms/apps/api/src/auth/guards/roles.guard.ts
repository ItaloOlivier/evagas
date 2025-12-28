import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    console.log('[RolesGuard] requiredRoles:', requiredRoles);

    if (!requiredRoles) {
      console.log('[RolesGuard] No required roles, allowing access');
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    console.log('[RolesGuard] user:', user ? { id: user.id, email: user.email, roles: user.roles } : 'NO USER');

    if (!user || !user.roles) {
      console.log('[RolesGuard] No user or roles, denying access');
      return false;
    }

    // Admin has access to everything
    if (user.roles.includes('admin')) {
      console.log('[RolesGuard] Admin user, allowing access');
      return true;
    }

    const hasRole = requiredRoles.some((role) => user.roles.includes(role));
    console.log('[RolesGuard] hasRole:', hasRole);
    return hasRole;
  }
}
