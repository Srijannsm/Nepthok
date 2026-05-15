import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DiscountType, OrderStatus, Prisma, TenantStatus } from "@nepthok/database";
import { calculatePrice } from "@nepthok/utils";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { OrderQueryDto } from "./dto/order-query.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";

const VALID_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
};

const ORDER_INCLUDE = {
  items: {
    select: {
      id: true,
      productId: true,
      productName: true,
      productSku: true,
      quantity: true,
      unitPrice: true,
      total: true,
    },
  },
  statusHistory: {
    orderBy: { createdAt: "desc" as const },
  },
} as const;

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      // a. Verify tenant exists and is ACTIVE
      const tenant = await tx.tenant.findUnique({ where: { id: dto.tenantId } });
      if (!tenant || tenant.status !== TenantStatus.ACTIVE) {
        throw new NotFoundException("Tenant not found or not active");
      }

      // b. Validate each item — fetch products, check stock
      const resolvedItems: Array<{
        productId: string;
        productName: string;
        productSku: string | null;
        quantity: number;
        unitPrice: number;
        total: number;
      }> = [];

      for (const item of dto.items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, tenantId: dto.tenantId, status: "ACTIVE" },
        });
        if (!product) {
          throw new NotFoundException(`Product not found: ${item.productId}`);
        }
        if (product.stock < item.quantity) {
          throw new BadRequestException(`Insufficient stock for: ${product.name}`);
        }
        const { unitPrice, total } = calculatePrice(
          { price: Number(product.price), pricingTiers: product.pricingTiers },
          item.quantity,
        );
        resolvedItems.push({
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          quantity: item.quantity,
          unitPrice,
          total,
        });
      }

      // c. Apply discount code if provided
      let discountAmount = 0;
      let discountCodeRecord: { id: string } | null = null;

      if (dto.discountCode) {
        const code = await tx.discountCode.findFirst({
          where: { tenantId: dto.tenantId, code: dto.discountCode, isActive: true },
        });
        if (!code) throw new BadRequestException("Discount code not found or inactive");
        if (code.expiresAt && code.expiresAt < new Date()) {
          throw new BadRequestException("Discount code has expired");
        }
        if (code.maxUses !== null && code.usedCount >= code.maxUses) {
          throw new BadRequestException("Discount code usage limit reached");
        }

        const subtotalForDiscount = resolvedItems.reduce((s, i) => s + i.total, 0);

        if (code.minOrderAmount !== null && subtotalForDiscount < Number(code.minOrderAmount)) {
          throw new BadRequestException(
            `Minimum order amount for this discount is NPR ${code.minOrderAmount}`,
          );
        }

        if (code.type === DiscountType.PERCENTAGE) {
          discountAmount = (subtotalForDiscount * Number(code.value)) / 100;
        } else {
          discountAmount = Math.min(Number(code.value), subtotalForDiscount);
        }

        discountCodeRecord = { id: code.id };
      }

      // d. Calculate totals
      const subtotal = resolvedItems.reduce((s, i) => s + i.total, 0);
      const shippingFee = 0;
      const total = subtotal - discountAmount + shippingFee;

      // e. Generate orderNumber (globally unique: slug prefix + per-tenant count)
      const orderCount = await tx.order.count({ where: { tenantId: dto.tenantId } });
      const prefix = tenant.slug.replace(/[^a-z0-9]/gi, "").substring(0, 4).toUpperCase();
      const orderNumber = `${prefix}-${(orderCount + 1).toString().padStart(5, "0")}`;

      // f. Create Order
      const order = await tx.order.create({
        data: {
          tenantId: dto.tenantId,
          orderNumber,
          buyerName: dto.buyerName,
          buyerEmail: dto.buyerEmail,
          buyerPhone: dto.buyerPhone,
          shippingAddress: dto.shippingAddress as unknown as Prisma.InputJsonValue,
          subtotal,
          shippingFee,
          discount: discountAmount,
          total,
          paymentMethod: dto.paymentMethod,
          notes: dto.notes ?? null,
        },
      });

      // g. Create OrderItems
      await tx.orderItem.createMany({
        data: resolvedItems.map((item) => ({
          orderId: order.id,
          tenantId: dto.tenantId,
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
      });

      // h. Create initial status history
      await tx.orderStatusHistory.create({
        data: { orderId: order.id, status: OrderStatus.PENDING, note: "Order placed" },
      });

      // i. Decrement stock for each item
      for (const item of resolvedItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // j. Increment discount code usage
      if (discountCodeRecord) {
        await tx.discountCode.update({
          where: { id: discountCodeRecord.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      return tx.order.findUnique({
        where: { id: order.id },
        include: ORDER_INCLUDE,
      });
    });
  }

  async findAll(tenantId: string, query: OrderQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      tenantId,
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { orderNumber: { contains: query.search, mode: "insensitive" } },
          { buyerName: { contains: query.search, mode: "insensitive" } },
          { buyerEmail: { contains: query.search, mode: "insensitive" } },
        ],
      }),
      ...(query.dateFrom || query.dateTo
        ? {
            createdAt: {
              ...(query.dateFrom && { gte: new Date(query.dateFrom) }),
              ...(query.dateTo && { lte: new Date(query.dateTo) }),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: ORDER_INCLUDE,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items, total, page, pageSize: limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, tenantId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId },
      include: {
        ...ORDER_INCLUDE,
        tenant: { select: { id: true, name: true, slug: true } },
      },
    });
    if (!order) throw new NotFoundException("Order not found");
    return order;
  }

  async trackOrder(orderNumber: string, buyerEmail: string) {
    const order = await this.prisma.order.findFirst({
      where: { orderNumber, buyerEmail },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        buyerName: true,
        createdAt: true,
        updatedAt: true,
        items: {
          select: {
            productName: true,
            quantity: true,
            unitPrice: true,
            total: true,
          },
        },
        statusHistory: {
          select: { status: true, note: true, createdAt: true },
          orderBy: { createdAt: "desc" as const },
        },
      },
    });
    if (!order) throw new NotFoundException("Order not found");
    return order;
  }

  async updateStatus(id: string, tenantId: string, dto: UpdateOrderStatusDto) {
    const order = await this.findOne(id, tenantId);
    const allowed = VALID_TRANSITIONS[order.status as OrderStatus] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Invalid status transition from ${order.status} to ${dto.status}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { status: dto.status },
        include: ORDER_INCLUDE,
      });

      await tx.orderStatusHistory.create({
        data: { orderId: id, status: dto.status, note: dto.note ?? null },
      });

      if (dto.status === OrderStatus.CANCELLED) {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      return updated;
    });
  }

  async cancelOrder(id: string, buyerEmail: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, buyerEmail },
      include: { items: true },
    });
    if (!order) throw new NotFoundException("Order not found");

    const cancellableStatuses: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.CONFIRMED];
    if (!cancellableStatuses.includes(order.status as OrderStatus)) {
      throw new BadRequestException(
        "Order cannot be cancelled after processing has started",
      );
    }

    return this.updateStatus(id, order.tenantId, { status: OrderStatus.CANCELLED });
  }
}
