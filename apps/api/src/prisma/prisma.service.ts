import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@nepthok/database";
import { tenantScopeMiddleware } from "./tenant-scope.middleware";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    this.$use(tenantScopeMiddleware);
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
