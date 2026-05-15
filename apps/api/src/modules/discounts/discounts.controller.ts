import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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
import { CreateDiscountDto } from "./dto/create-discount.dto";
import { UpdateDiscountDto } from "./dto/update-discount.dto";
import { ValidateDiscountDto } from "./dto/validate-discount.dto";
import { DiscountsService } from "./discounts.service";

@Controller()
export class DiscountsController {
  constructor(private discountsService: DiscountsService) {}

  // ─── Public routes ────────────────────────────────────────────────────────

  @Get("discounts/validate")
  validate(@Query() dto: ValidateDiscountDto) {
    return this.discountsService.validate(dto);
  }

  // ─── Seller routes ─────────────────────────────────────────────────────────

  @Get("seller/discounts")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER_ADMIN)
  findAll(
    @CurrentUser() user: JwtUser,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.discountsService.findAll(user.tenantId!, page, limit);
  }

  @Get("seller/discounts/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER_ADMIN)
  findOne(@Param("id") id: string, @CurrentUser() user: JwtUser) {
    return this.discountsService.findOne(id, user.tenantId!);
  }

  @Post("seller/discounts")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER_ADMIN)
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateDiscountDto) {
    return this.discountsService.create(user.tenantId!, dto);
  }

  @Patch("seller/discounts/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER_ADMIN)
  update(
    @Param("id") id: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateDiscountDto,
  ) {
    return this.discountsService.update(id, user.tenantId!, dto);
  }

  @Delete("seller/discounts/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER_ADMIN)
  deactivate(@Param("id") id: string, @CurrentUser() user: JwtUser) {
    return this.discountsService.deactivate(id, user.tenantId!);
  }
}
