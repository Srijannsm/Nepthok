import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { PaymentMethod } from "@nepthok/database";

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  planId: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}
