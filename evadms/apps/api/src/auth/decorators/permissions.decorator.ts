import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// Alias for backwards compatibility
export const RequirePermissions = Permissions;

// Convenience decorators for common permission patterns
export const CanCreate = (resource: string) => Permissions(`${resource}:create`);
export const CanRead = (resource: string) => Permissions(`${resource}:read`);
export const CanUpdate = (resource: string) => Permissions(`${resource}:update`);
export const CanDelete = (resource: string) => Permissions(`${resource}:delete`);
export const CanApprove = (resource: string) => Permissions(`${resource}:approve`);
