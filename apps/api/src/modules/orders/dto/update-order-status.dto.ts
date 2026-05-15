import { IsEnum, IsOptional, IsString } from "class-validator";
import { OrderStatus } from "@nepthok/database";

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @IsString()
  note?: string;
}
