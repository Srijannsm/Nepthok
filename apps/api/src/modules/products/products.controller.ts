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
import { UserRole } from "@nepthok/database";
import { CurrentUser } from "../../common/decorators/roles.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { JwtUser } from "../auth/strategies/jwt.strategy";
import { CreateProductDto } from "./dto/create-product.dto";
import { ProductQueryDto } from "./dto/product-query.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductsService } from "./products.service";

@Controller()
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  // ─── Public routes ────────────────────────────────────────────────────────

  @Get("products")
  findPublic(@Query() query: ProductQueryDto) {
    return this.productsService.findPublic(query);
  }

  @Get("products/:id/price")
  getPricingForQuantity(
    @Param("id") id: string,
    @Query("quantity") quantity: string,
  ) {
    const qty = parseInt(quantity, 10);
    if (!qty || qty < 1) throw new BadRequestException("quantity must be a positive integer");
    return this.productsService.getPricingForQuantity(id, qty);
  }

  @Get("products/:id")
  findOnePublic(@Param("id") id: string) {
    return this.productsService.findOnePublic(id);
  }

  // ─── Seller routes ─────────────────────────────────────────────────────────

  @Get("seller/products")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER_ADMIN, UserRole.SELLER_STAFF)
  findAll(@CurrentUser() user: JwtUser, @Query() query: ProductQueryDto) {
    return this.productsService.findAll(user.tenantId!, query);
  }

  @Post("seller/products")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER_ADMIN)
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateProductDto) {
    return this.productsService.create(user.tenantId!, dto);
  }

  @Patch("seller/products/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER_ADMIN)
  update(
    @Param("id") id: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, user.tenantId!, dto);
  }

  @Patch("seller/products/:id/stock")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER_ADMIN, UserRole.SELLER_STAFF)
  updateStock(
    @Param("id") id: string,
    @CurrentUser() user: JwtUser,
    @Body("quantity") quantity: number,
  ) {
    return this.productsService.updateStock(id, user.tenantId!, quantity);
  }

  @Delete("seller/products/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER_ADMIN)
  delete(@Param("id") id: string, @CurrentUser() user: JwtUser) {
    return this.productsService.delete(id, user.tenantId!);
  }

  // ─── Admin routes ──────────────────────────────────────────────────────────

  @Get("admin/products")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  findAllAdmin(@Query() query: ProductQueryDto) {
    return this.productsService.findAllAdmin(query);
  }
}
