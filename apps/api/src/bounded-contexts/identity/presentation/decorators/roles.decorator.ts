import { SetMetadata, CustomDecorator } from '@nestjs/common';
import { UserRole } from '@diety/types';

export const ROLES_KEY = 'roles';

/**
 * Roles Decorator
 * 
 * Attaches role metadata to controller route handlers for RBAC enforcement.
 * Example: @Roles(UserRole.DIETITIAN, UserRole.ADMIN)
 */
export const Roles = (...roles: UserRole[]): CustomDecorator<string> =>
  SetMetadata(ROLES_KEY, roles);
