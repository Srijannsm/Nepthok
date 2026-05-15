import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { UserRole } from "@nepthok/database";
import { CurrentUser } from "../../common/decorators/roles.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { JwtUser } from "../auth/strategies/jwt.strategy";
import { CreateSubscriptionDto } from "./dto/create-subscription.dto";
import { RecordPaymentDto } from "./dto/record-payment.dto";
import { SubscriptionsService } from "./subscriptions.service";

@Controller("subscriptions")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  findAll(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query("status") status?: string,
  ) {
    return this.subscriptionsService.findAll(page, limit, status);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  create(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(dto);
  }

  @Post(":id/payments")
  @Roles(UserRole.SUPER_ADMIN)
  recordPayment(@Param("id") id: string, @Body() dto: RecordPaymentDto) {
    return this.subscriptionsService.recordPayment(id, dto);
  }

  @Get("my")
  @Roles(UserRole.SELLER_ADMIN)
  getMySubscription(@CurrentUser() user: JwtUser) {
    return this.subscriptionsService.findByTenant(user.tenantId!);
  }

  @Get("check-access")
  @Roles(UserRole.SELLER_ADMIN, UserRole.SELLER_STAFF)
  checkAccess(
    @CurrentUser() user: JwtUser,
    @Query("feature") feature: string,
  ) {
    return this.subscriptionsService.checkAccess(user.tenantId!, feature);
  }

  @Delete(":id")
  @Roles(UserRole.SELLER_ADMIN)
  cancel(@Param("id") id: string, @CurrentUser() user: JwtUser) {
    return this.subscriptionsService.cancel(id, user.tenantId!);
  }
}
