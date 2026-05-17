import { MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import { TenantMiddleware } from "../../common/middleware/tenant.middleware";
import { PrismaModule } from "../../prisma/prisma.module";
import { SellersController } from "./sellers.controller";
import { TenantsController } from "./tenants.controller";
import { TenantsService } from "./tenants.service";

@Module({
  imports: [PrismaModule],
  controllers: [TenantsController, SellersController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude({ path: "auth/(.*)", method: RequestMethod.ALL })
      .forRoutes("*");
  }
}
