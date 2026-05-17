import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query } from "@nestjs/common";
import { TenantsService } from "./tenants.service";

@Controller("sellers")
export class SellersController {
  constructor(private tenantsService: TenantsService) {}

  @Get()
  findAll(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.tenantsService.findPublicSellers(page, limit);
  }
}
