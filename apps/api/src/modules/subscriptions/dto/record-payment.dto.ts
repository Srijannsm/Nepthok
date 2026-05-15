import { IsEnum, IsNumber, IsObject, IsOptional, IsString, Min } from "class-validator";
import { PaymentMethod } from "@nepthok/database";

export class RecordPaymentDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
