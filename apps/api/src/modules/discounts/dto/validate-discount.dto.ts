import { IsNumber, IsString, Min } from "class-validator";

export class ValidateDiscountDto {
  @IsString()
  code: string;

  @IsString()
  tenantId: string;

  @IsNumber()
  @Min(0)
  orderAmount: number;
}
