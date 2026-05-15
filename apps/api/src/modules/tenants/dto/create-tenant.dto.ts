import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateTenantDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: "slug must contain only lowercase letters, numbers, and hyphens" })
  @MinLength(2)
  @MaxLength(50)
  slug: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  ownerName: string;

  @Matches(/^(\+977)?[9][6-9]\d{8}$/, { message: "phone must be a valid Nepal phone number" })
  phone: string;

  @IsOptional()
  @IsString()
  description?: string;
}
