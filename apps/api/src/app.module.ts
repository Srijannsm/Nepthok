import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule } from "./config/config.module";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { TenantsModule } from "./modules/tenants/tenants.module";
import { PlansModule } from "./modules/plans/plans.module";
import { SubscriptionsModule } from "./modules/subscriptions/subscriptions.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { ProductsModule } from "./modules/products/products.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { DiscountsModule } from "./modules/discounts/discounts.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";

@Module({
  imports: [ConfigModule, PrismaModule, AuthModule, TenantsModule, PlansModule, SubscriptionsModule, CategoriesModule, ProductsModule, OrdersModule, DiscountsModule, AnalyticsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
