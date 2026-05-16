import { Injectable, NestMiddleware, NotFoundException } from "@nestjs/common";
import { TenantStatus } from "@nepthok/database";
import { NextFunction, Request, Response } from "express";
import { PrismaService } from "../../prisma/prisma.service";
import { setTenantContext } from "../../prisma/tenant-context";

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request & { tenant?: unknown }, _res: Response, next: NextFunction) {
    const slugFromHeader = req.headers["x-tenant-slug"] as string | undefined;

    const storeMatch = req.path.match(/^\/store\/([^/]+)/);
    const slugFromPath = storeMatch?.[1];

    const slug = slugFromHeader ?? slugFromPath;

    if (!slug) {
      return setTenantContext(null, () => next());
    }

    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });

    if (!tenant || tenant.status === TenantStatus.SUSPENDED) {
      throw new NotFoundException("Tenant not found");
    }

    req.tenant = tenant;
    setTenantContext(tenant.id, () => next());
  }
}
