import { Type } from "class-transformer";
import { IsNumber, IsString, Min } from "class-validator";

export class ValidateDiscountDto {
  @IsString()
  code: string;

  @IsString()
  tenantId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  orderAmount: number;
}
