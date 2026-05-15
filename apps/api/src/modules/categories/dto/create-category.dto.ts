import {
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MinLength,
} from "class-validator";

export class CreateCategoryDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: "slug must contain only lowercase letters, numbers, and hyphens" })
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  image?: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}
