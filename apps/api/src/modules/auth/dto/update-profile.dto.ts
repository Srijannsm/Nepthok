import { IsOptional, IsString, MinLength, Matches } from "class-validator";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @Matches(/^(\+977)?[9][6-9]\d{8}$/, { message: "phone must be a valid Nepal phone number" })
  phone?: string;
}
