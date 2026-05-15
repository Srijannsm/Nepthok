import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, PaymentStatus, SubscriptionStatus } from "@nepthok/database";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateSubscriptionDto } from "./dto/create-subscription.dto";
import { RecordPaymentDto } from "./dto/record-payment.dto";

const SUBSCRIPTION_INCLUDE = {
  plan: {
    select: {
      id: true,
      name: true,
      tier: true,
      price: true,
      billingCycle: true,
      features: true,
    },
  },
  payments: {
    select: {
      id: true,
      amount: true,
      method: true,
      status: true,
      paidAt: true,
      transactionId: true,
    },
    orderBy: { createdAt: "desc" as const },
    take: 5,
  },
} as const;

function periodEnd(from: Date): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + 30);
  return d;
}

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page: number, limit: number, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { status: status as SubscriptionStatus } : {};

    const [items, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        include: {
          plan: {
            select: { id: true, name: true, tier: true, price: true, billingCycle: true },
          },
          payments: {
            select: { id: true, amount: true, method: true, status: true, paidAt: true, transactionId: true },
            orderBy: { createdAt: "desc" as const },
            take: 1,
          },
          tenant: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.subscription.count({ where }),
    ]);

    return { items, total, page, pageSize: limit, totalPages: Math.ceil(total / limit) };
  }

  async create(dto: CreateSubscriptionDto) {
    const [tenant, plan] = await Promise.all([
      this.prisma.tenant.findUnique({ where: { id: dto.tenantId }, include: { subscription: true } }),
      this.prisma.plan.findUnique({ where: { id: dto.planId } }),
    ]);

    if (!tenant) throw new NotFoundException("Tenant not found");
    if (!plan) throw new NotFoundException("Plan not found");

    if (
      tenant.subscription &&
      tenant.subscription.status === SubscriptionStatus.ACTIVE
    ) {
      throw new BadRequestException("Tenant already has an active subscription");
    }

    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      // Reuse existing record (unique tenantId) if prior sub was cancelled/expired
      if (tenant.subscription) {
        return tx.subscription.update({
          where: { tenantId: dto.tenantId },
          data: {
            planId: dto.planId,
            status: SubscriptionStatus.TRIAL,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd(now),
            cancelledAt: null,
          },
          include: SUBSCRIPTION_INCLUDE,
        });
      }
      return tx.subscription.create({
        data: {
          tenantId: dto.tenantId,
          planId: dto.planId,
          status: SubscriptionStatus.TRIAL,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd(now),
        },
        include: SUBSCRIPTION_INCLUDE,
      });
    });
  }

  async recordPayment(subscriptionId: string, dto: RecordPaymentDto) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });
    if (!subscription) throw new NotFoundException("Subscription not found");

    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      await tx.subscriptionPayment.create({
        data: {
          subscriptionId,
          tenantId: subscription.tenantId,
          amount: dto.amount,
          currency: "NPR",
          method: dto.method,
          status: PaymentStatus.COMPLETED,
          transactionId: dto.transactionId ?? null,
          paidAt: now,
          metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
        },
      });

      return tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd(now),
        },
        include: SUBSCRIPTION_INCLUDE,
      });
    });
  }

  async findByTenant(tenantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
      include: SUBSCRIPTION_INCLUDE,
    });
    if (!subscription) throw new NotFoundException("No subscription found for this tenant");
    return subscription;
  }

  async checkAccess(tenantId: string, feature: string): Promise<boolean> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: { select: { features: true } } },
    });

    if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE) {
      return false;
    }

    const features = subscription.plan.features as string[];
    return features.includes(feature);
  }

  async expire(subscriptionId: string) {
    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: SubscriptionStatus.EXPIRED },
    });
  }

  async cancel(subscriptionId: string, tenantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) throw new NotFoundException("Subscription not found");
    if (subscription.tenantId !== tenantId)
      throw new NotFoundException("Subscription not found");
    if (subscription.status === SubscriptionStatus.CANCELLED)
      throw new BadRequestException("Subscription is already cancelled");

    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
      },
      include: SUBSCRIPTION_INCLUDE,
    });
  }
}
