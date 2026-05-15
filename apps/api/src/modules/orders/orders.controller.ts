import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { OrderStatus, UserRole } from "@nepthok/database";
import { CurrentUser } from "../../common/decorators/roles.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { JwtUser } from "../auth/strategies/jwt.strategy";
import { CreateOrderDto } from "./dto/create-order.dto";
import { OrderQueryDto } from "./dto/order-query.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { OrdersService } from "./orders.service";

@Controller()
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  // ─── Public routes ────────────────────────────────────────────────────────

  @Post("orders")
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get("orders/track")
  trackOrder(
    @Query("orderNumber") orderNumber: string,
    @Query("email") email: string,
  ) {
    if (!orderNumber || !email) {
      throw new BadRequestException("orderNumber and email are required");
    }
    return this.ordersService.trackOrder(orderNumber, email);
  }

  // ─── Super admin routes ───────────────────────────────────────────────────

  @Get("admin/orders")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  findAllAdmin(@Query() query: OrderQueryDto) {
    return this.ordersService.findAllAdmin(query);
  }

  // ─── Seller routes ─────────────────────────────────────────────────────────

  @Get("seller/orders")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER_ADMIN, UserRole.SELLER_STAFF)
  findAll(@CurrentUser() user: JwtUser, @Query() query: OrderQueryDto) {
    return this.ordersService.findAll(user.tenantId!, query);
  }

  @Get("seller/orders/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER_ADMIN, UserRole.SELLER_STAFF)
  findOne(@Param("id") id: string, @CurrentUser() user: JwtUser) {
    return this.ordersService.findOne(id, user.tenantId!);
  }

  @Patch("seller/orders/:id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER_ADMIN)
  updateStatus(
    @Param("id") id: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, user.tenantId!, dto);
  }

  @Delete("seller/orders/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER_ADMIN)
  cancel(@Param("id") id: string, @CurrentUser() user: JwtUser) {
    return this.ordersService.updateStatus(id, user.tenantId!, { status: OrderStatus.CANCELLED });
  }
}
