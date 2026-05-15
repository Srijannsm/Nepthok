import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { UserRole } from "@nepthok/database";
import { Request } from "express";

interface AuthenticatedUser {
  id: string;
  role: UserRole;
  tenantId?: string | null;
}

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: AuthenticatedUser; params: Record<string, string> }>();

    const user = request.user;

    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    const tenantId = request.params.tenantId ?? (request.body as Record<string, string>)?.tenantId;

    if (tenantId && user.tenantId !== tenantId) {
      throw new ForbiddenException("Forbidden — insufficient permissions");
    }

    return true;
  }
}
