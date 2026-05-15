import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { UserRole } from "@nepthok/database";
import { CurrentUser } from "../../common/decorators/roles.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { JwtUser } from "../auth/strategies/jwt.strategy";
import { AnalyticsService } from "./analytics.service";
import { AnalyticsQueryDto } from "./dto/analytics-query.dto";

@Controller("analytics")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get("dashboard")
  @Roles(UserRole.SELLER_ADMIN, UserRole.SELLER_STAFF)
  getDashboard(@CurrentUser() user: JwtUser, @Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getDashboard(user.tenantId!, query);
  }

  @Get("platform")
  @Roles(UserRole.SUPER_ADMIN)
  getPlatformOverview(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getPlatformOverview(query);
  }

  @Post("snapshot")
  @Roles(UserRole.SUPER_ADMIN)
  triggerSnapshot(@Body() body: { date?: string }) {
    const date = body.date ? new Date(body.date) : (() => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday;
    })();
    return this.analyticsService.recordAllTenantsSnapshot(date);
  }
}
