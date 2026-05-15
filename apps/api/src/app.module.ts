import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule } from "./config/config.module";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { TenantsModule } from "./modules/tenants/tenants.module";
import { PlansModule } from "./modules/plans/plans.module";

@Module({
  imports: [ConfigModule, PrismaModule, AuthModule, TenantsModule, PlansModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
