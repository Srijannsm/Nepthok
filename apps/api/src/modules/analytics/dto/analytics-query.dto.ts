import { IsDateString, IsIn, IsOptional } from "class-validator";

export class AnalyticsQueryDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsIn(["7d", "30d", "90d"])
  period?: string;
}
