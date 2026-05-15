import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateCategoryDto } from "./dto/create-category.dto";

const CATEGORY_CHILDREN = {
  children: {
    where: { isActive: true },
    include: {
      children: { where: { isActive: true } },
    },
  },
} as const;

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException("Category slug is already taken");

    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        image: dto.image,
        parentId: dto.parentId ?? null,
        isActive: true,
      },
      include: CATEGORY_CHILDREN,
    });
  }

  findAll() {
    return this.prisma.category.findMany({
      where: { isActive: true, parentId: null },
      include: CATEGORY_CHILDREN,
      orderBy: { name: "asc" },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        ...CATEGORY_CHILDREN,
      },
    });
    if (!category) throw new NotFoundException("Category not found");
    return category;
  }

  async update(id: string, dto: Partial<CreateCategoryDto>) {
    await this.findOne(id);
    return this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.image !== undefined && { image: dto.image }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
      },
      include: CATEGORY_CHILDREN,
    });
  }

  async deactivate(id: string) {
    await this.findOne(id);

    const activeChildCount = await this.prisma.category.count({
      where: { parentId: id, isActive: true },
    });
    if (activeChildCount > 0) {
      throw new BadRequestException("Cannot deactivate a category that has active subcategories");
    }

    return this.prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
