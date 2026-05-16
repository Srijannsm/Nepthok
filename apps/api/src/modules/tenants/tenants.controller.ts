import {
  Body,
  Controller,
  DefaultValuePipe,
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
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { UpdateTenantDto } from "./dto/update-tenant.dto";
import { TenantsService } from "./tenants.service";

@Controller("tenants")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  findAll(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query("search") search?: string,
    @Query("status") status?: string,
  ) {
    return this.tenantsService.findAll(page, limit, search, status);
  }

  @Get("my")
  @Roles(UserRole.SELLER_ADMIN, UserRole.SELLER_STAFF)
  getMyTenant(@CurrentUser() user: JwtUser) {
    return this.tenantsService.getMyTenant(user.tenantId!);
  }

  @Get(":id")
  @Roles(UserRole.SUPER_ADMIN)
  findOne(@Param("id") id: string) {
    return this.tenantsService.findOne(id);
  }

  @Patch(":id/approve")
  @Roles(UserRole.SUPER_ADMIN)
  approve(@Param("id") id: string) {
    return this.tenantsService.approve(id);
  }

  @Patch(":id/suspend")
  @Roles(UserRole.SUPER_ADMIN)
  suspend(@Param("id") id: string, @Body("reason") reason: string) {
    return this.tenantsService.suspend(id, reason);
  }

  @Patch(":id")
  @Roles(UserRole.SELLER_ADMIN)
  update(
    @Param("id") id: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.tenantsService.update(id, user.tenantId!, dto);
  }
}
