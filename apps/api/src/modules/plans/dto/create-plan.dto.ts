import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from "class-validator";
import { BillingCycle, PlanTier } from "@nepthok/database";

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: "slug must contain only lowercase letters, numbers, and hyphens" })
  slug: string;

  @IsEnum(PlanTier)
  tier: PlanTier;

  @IsNumber()
  @Min(0)
  price: number;

  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxProducts?: number;

  @IsArray()
  @IsString({ each: true })
  features: string[];

  @IsBoolean()
  isActive: boolean;
}
