import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DiscountType } from "@nepthok/database";
import { PrismaService } from "../../prisma/prisma.service";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";
import { CreateDiscountDto } from "./dto/create-discount.dto";
import { UpdateDiscountDto } from "./dto/update-discount.dto";
import { ValidateDiscountDto } from "./dto/validate-discount.dto";

function computeFields(code: {
  usedCount: number;
  maxUses: number | null;
  expiresAt: Date | null;
}) {
  return {
    usagePercentage: code.maxUses !== null ? (code.usedCount / code.maxUses) * 100 : null,
    isExpired: code.expiresAt !== null ? code.expiresAt < new Date() : false,
    remainingUses: code.maxUses !== null ? code.maxUses - code.usedCount : null,
  };
}

const DISCOUNT_INCLUDE = {
  discountProducts: {
    select: { productId: true },
  },
} as const;

@Injectable()
export class DiscountsService {
  constructor(
    private prisma: PrismaService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async create(tenantId: string, dto: CreateDiscountDto) {
    const hasAccess = await this.subscriptionsService.checkAccess(tenantId, "discount_codes");
    if (!hasAccess) {
      throw new ForbiddenException("Upgrade to Pro to use discount codes");
    }

    if (dto.type === DiscountType.PERCENTAGE && dto.value > 100) {
      throw new BadRequestException("Percentage discount cannot exceed 100%");
    }

    const existing = await this.prisma.discountCode.findUnique({
      where: { tenantId_code: { tenantId, code: dto.code } },
    });
    if (existing) throw new BadRequestException("Discount code already exists in this store");

    const discountCode = await this.prisma.discountCode.create({
      data: {
        tenantId,
        code: dto.code,
        type: dto.type,
        value: dto.value,
        minOrderAmount: dto.minOrderAmount ?? null,
        maxUses: dto.maxUses ?? null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        isActive: dto.isActive ?? true,
      },
      include: DISCOUNT_INCLUDE,
    });

    if (dto.productIds && dto.productIds.length > 0) {
      await this.prisma.discountProduct.createMany({
        data: dto.productIds.map((productId) => ({
          discountCodeId: discountCode.id,
          productId,
        })),
        skipDuplicates: true,
      });
    }

    const result = await this.prisma.discountCode.findUnique({
      where: { id: discountCode.id },
      include: DISCOUNT_INCLUDE,
    });

    return { ...result, ...computeFields(result!) };
  }

  async findAll(tenantId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.discountCode.findMany({
        where: { tenantId },
        skip,
        take: limit,
        include: DISCOUNT_INCLUDE,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.discountCode.count({ where: { tenantId } }),
    ]);

    return {
      items: items.map((c) => ({ ...c, ...computeFields(c) })),
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, tenantId: string) {
    const code = await this.prisma.discountCode.findFirst({
      where: { id, tenantId },
      include: DISCOUNT_INCLUDE,
    });
    if (!code) throw new NotFoundException("Discount code not found");
    return { ...code, ...computeFields(code) };
  }

  async validate(dto: ValidateDiscountDto) {
    const code = await this.prisma.discountCode.findFirst({
      where: { tenantId: dto.tenantId, code: dto.code, isActive: true },
    });

    if (!code) throw new BadRequestException("Invalid or expired discount code");
    if (code.expiresAt && code.expiresAt < new Date()) {
      throw new BadRequestException("Invalid or expired discount code");
    }
    if (code.maxUses !== null && code.usedCount >= code.maxUses) {
      throw new BadRequestException("Invalid or expired discount code");
    }
    if (code.minOrderAmount !== null && dto.orderAmount < Number(code.minOrderAmount)) {
      throw new BadRequestException(
        `Minimum order amount for this code is NPR ${code.minOrderAmount}`,
      );
    }

    const numericValue = Number(code.value);
    const discountAmount =
      code.type === DiscountType.PERCENTAGE
        ? Math.min((dto.orderAmount * numericValue) / 100, dto.orderAmount)
        : Math.min(numericValue, dto.orderAmount);

    return {
      code: code.code,
      type: code.type,
      value: numericValue,
      discountAmount,
      finalAmount: dto.orderAmount - discountAmount,
    };
  }

  async update(id: string, tenantId: string, dto: UpdateDiscountDto) {
    await this.findOne(id, tenantId);

    const updated = await this.prisma.discountCode.update({
      where: { id },
      data: {
        ...(dto.value !== undefined && { value: dto.value }),
        ...(dto.minOrderAmount !== undefined && { minOrderAmount: dto.minOrderAmount }),
        ...(dto.maxUses !== undefined && { maxUses: dto.maxUses }),
        ...(dto.expiresAt !== undefined && { expiresAt: new Date(dto.expiresAt) }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: DISCOUNT_INCLUDE,
    });

    if (dto.productIds !== undefined) {
      await this.prisma.discountProduct.deleteMany({ where: { discountCodeId: id } });
      if (dto.productIds.length > 0) {
        await this.prisma.discountProduct.createMany({
          data: dto.productIds.map((productId) => ({ discountCodeId: id, productId })),
          skipDuplicates: true,
        });
      }
    }

    const result = await this.prisma.discountCode.findUnique({
      where: { id },
      include: DISCOUNT_INCLUDE,
    });

    return { ...result, ...computeFields(result!) };
  }

  async deactivate(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.discountCode.update({
      where: { id },
      data: { isActive: false },
      include: DISCOUNT_INCLUDE,
    });
  }
}
