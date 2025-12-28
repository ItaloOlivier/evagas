import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

// Permission can be a string like "resource:action" or an object { resource, action }
type PermissionInput = string | { resource: string; action: string };

export const Permissions = (...permissions: PermissionInput[]) => {
  const normalizedPermissions = permissions.map((p) =>
    typeof p === 'string' ? p : `${p.resource}:${p.action}`
  );
  return SetMetadata(PERMISSIONS_KEY, normalizedPermissions);
};

// Alias for backwards compatibility
export const RequirePermissions = Permissions;

// Convenience decorators for common permission patterns
export const CanCreate = (resource: string) => Permissions(`${resource}:create`);
export const CanRead = (resource: string) => Permissions(`${resource}:read`);
export const CanUpdate = (resource: string) => Permissions(`${resource}:update`);
export const CanDelete = (resource: string) => Permissions(`${resource}:delete`);
export const CanApprove = (resource: string) => Permissions(`${resource}:approve`);
