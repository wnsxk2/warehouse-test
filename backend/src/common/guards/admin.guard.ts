import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * Guard to check if user has ADMIN role (not SUPER_ADMIN)
 * This is for company admins who manage their own company
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user is ADMIN (company admin)
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    // Check if user has a company
    if (!user.companyId) {
      throw new ForbiddenException('Admin must be assigned to a company');
    }

    return true;
  }
}
