import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreatePlanDto } from "./dto/create-plan.dto";

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePlanDto) {
    const existing = await this.prisma.plan.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException("Plan slug is already taken");

    return this.prisma.plan.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        tier: dto.tier,
        price: dto.price,
        billingCycle: dto.billingCycle,
        maxProducts: dto.maxProducts ?? null,
        features: dto.features,
        isActive: dto.isActive,
      },
    });
  }

  findAll() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    });
  }

  async findOne(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException("Plan not found");
    return plan;
  }

  async update(id: string, dto: Partial<CreatePlanDto>) {
    await this.findOne(id);
    return this.prisma.plan.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.tier !== undefined && { tier: dto.tier }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.billingCycle !== undefined && { billingCycle: dto.billingCycle }),
        ...(dto.maxProducts !== undefined && { maxProducts: dto.maxProducts }),
        ...(dto.features !== undefined && { features: dto.features }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.plan.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
