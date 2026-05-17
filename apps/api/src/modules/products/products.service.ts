import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OrderStatus, Prisma, ProductStatus, SubscriptionStatus } from "@nepthok/database";
import { calculatePrice } from "@nepthok/utils";
import { PrismaService } from "../../prisma/prisma.service";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { ProductQueryDto, ProductSortOrder } from "./dto/product-query.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { validatePricingTiers } from "./pricing-tiers.validator";

const PRODUCT_BASE = {
  category: { select: { id: true, name: true, slug: true } },
  tenant: { select: { id: true, name: true, slug: true } },
} as const;

function buildOrderBy(sort?: ProductSortOrder): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case ProductSortOrder.PriceAsc:  return { price: "asc" };
    case ProductSortOrder.PriceDesc: return { price: "desc" };
    case ProductSortOrder.Popular:   return { orderItems: { _count: "desc" } };
    default:                         return { createdAt: "desc" };
  }
}

function buildPriceFilter(min?: number, max?: number): Prisma.DecimalFilter | undefined {
  if (min === undefined && max === undefined) return undefined;
  return {
    ...(min !== undefined && { gte: min }),
    ...(max !== undefined && { lte: max }),
  };
}

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async create(tenantId: string, dto: CreateProductDto) {
    const hasAccess = await this.subscriptionsService.checkAccess(tenantId, "product_management");
    if (!hasAccess) {
      throw new ForbiddenException("Active subscription with product_management feature required");
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: { select: { maxProducts: true } } },
    });

    if (
      subscription?.status === SubscriptionStatus.ACTIVE &&
      subscription.plan.maxProducts !== null
    ) {
      const productCount = await this.prisma.product.count({
        where: {
          tenantId,
          status: { in: [ProductStatus.ACTIVE, ProductStatus.DRAFT] },
        },
      });
      if (productCount >= subscription.plan.maxProducts) {
        throw new ForbiddenException("Product limit reached. Upgrade to Pro.");
      }
    }

    const slugTaken = await this.prisma.product.findUnique({
      where: { tenantId_slug: { tenantId, slug: dto.slug } },
    });
    if (slugTaken) throw new BadRequestException("Product slug is already taken in this store");

    if (dto.pricingTiers && dto.pricingTiers.length > 0) {
      const tierError = validatePricingTiers(dto.pricingTiers);
      if (tierError) throw new BadRequestException(tierError);
    }

    return this.prisma.product.create({
      data: {
        tenantId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        price: dto.price,
        comparePrice: dto.comparePrice ?? null,
        sku: dto.sku ?? null,
        stock: dto.stock,
        lowStockThreshold: dto.lowStockThreshold ?? 5,
        images: dto.images,
        categoryId: dto.categoryId,
        isFeatured: dto.isFeatured ?? false,
        metadata: dto.metadata !== undefined ? (dto.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
        pricingTiers: dto.pricingTiers ? (dto.pricingTiers as Prisma.InputJsonValue) : Prisma.JsonNull,
        status: ProductStatus.DRAFT,
      },
      include: PRODUCT_BASE,
    });
  }

  async findAll(tenantId: string, query: ProductQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      tenantId,
      ...(query.status && { status: query.status }),
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.search && { name: { contains: query.search, mode: "insensitive" } }),
      ...(query.inStock !== undefined && query.inStock && { stock: { gt: 0 } }),
      ...(query.inStock !== undefined && !query.inStock && { stock: { equals: 0 } }),
    };

    const priceFilter = buildPriceFilter(query.minPrice, query.maxPrice);
    if (priceFilter) where.price = priceFilter;

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({ where, skip, take: limit, include: PRODUCT_BASE, orderBy: { createdAt: "desc" } }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total, page, pageSize: limit, totalPages: Math.ceil(total / limit) };
  }

  async findAllAdmin(query: ProductQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      ...(query.status && { status: query.status }),
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.search && { name: { contains: query.search, mode: "insensitive" } }),
    };

    const priceFilter = buildPriceFilter(query.minPrice, query.maxPrice);
    if (priceFilter) where.price = priceFilter;

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({ where, skip, take: limit, include: PRODUCT_BASE, orderBy: { createdAt: "desc" } }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total, page, pageSize: limit, totalPages: Math.ceil(total / limit) };
  }

  async findPublic(query: ProductQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.ACTIVE,
      ...(query.tenantId && { tenantId: query.tenantId }),
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.search && { name: { contains: query.search, mode: "insensitive" } }),
      ...(query.inStock && { stock: { gt: 0 } }),
    };

    const priceFilter = buildPriceFilter(query.minPrice, query.maxPrice);
    if (priceFilter) where.price = priceFilter;

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({ where, skip, take: limit, include: PRODUCT_BASE, orderBy: buildOrderBy(query.sort) }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total, page, pageSize: limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, tenantId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
      include: PRODUCT_BASE,
    });
    if (!product) throw new NotFoundException("Product not found");
    return product;
  }

  async findOnePublic(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, status: ProductStatus.ACTIVE },
      include: PRODUCT_BASE,
    });
    if (!product) throw new NotFoundException("Product not found");
    return product;
  }

  async update(id: string, tenantId: string, dto: UpdateProductDto) {
    const product = await this.findOne(id, tenantId);

    if (dto.status === ProductStatus.ARCHIVED) {
      const pendingCount = await this.prisma.orderItem.count({
        where: {
          productId: id,
          order: {
            status: {
              in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING],
            },
          },
        },
      });
      if (pendingCount > 0) {
        throw new BadRequestException("Cannot archive product with pending orders");
      }
    }

    if (dto.slug && dto.slug !== product.slug) {
      const slugTaken = await this.prisma.product.findUnique({
        where: { tenantId_slug: { tenantId, slug: dto.slug } },
      });
      if (slugTaken) throw new BadRequestException("Product slug is already taken in this store");
    }

    if (dto.pricingTiers && dto.pricingTiers.length > 0) {
      const tierError = validatePricingTiers(dto.pricingTiers);
      if (tierError) throw new BadRequestException(tierError);
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.comparePrice !== undefined && { comparePrice: dto.comparePrice }),
        ...(dto.sku !== undefined && { sku: dto.sku }),
        ...(dto.stock !== undefined && { stock: dto.stock }),
        ...(dto.lowStockThreshold !== undefined && { lowStockThreshold: dto.lowStockThreshold }),
        ...(dto.images !== undefined && { images: dto.images }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.isFeatured !== undefined && { isFeatured: dto.isFeatured }),
        ...(dto.metadata !== undefined && { metadata: dto.metadata as Prisma.InputJsonValue }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.pricingTiers !== undefined && {
          pricingTiers: dto.pricingTiers as Prisma.InputJsonValue,
        }),
      },
      include: PRODUCT_BASE,
    });
  }

  async updateStock(id: string, tenantId: string, quantity: number) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({ where: { id, tenantId } });
      if (!product) throw new NotFoundException("Product not found");
      if (product.stock + quantity < 0) {
        throw new BadRequestException("Insufficient stock");
      }
      return tx.product.update({
        where: { id },
        data: { stock: { increment: quantity } },
        include: PRODUCT_BASE,
      });
    });
  }

  async getPricingForQuantity(productId: string, quantity: number) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, status: ProductStatus.ACTIVE },
    });
    if (!product) throw new NotFoundException("Product not found");

    const numericPrice = Number(product.price);
    const result = calculatePrice(
      { price: numericPrice, pricingTiers: product.pricingTiers },
      quantity,
    );

    return { ...result, quantity };
  }

  async delete(id: string, tenantId: string) {
    await this.findOne(id, tenantId);

    const orderCount = await this.prisma.orderItem.count({ where: { productId: id } });
    if (orderCount > 0) {
      throw new BadRequestException(
        "Cannot delete product with order history. Archive it instead.",
      );
    }

    return this.prisma.product.delete({ where: { id } });
  }
}
