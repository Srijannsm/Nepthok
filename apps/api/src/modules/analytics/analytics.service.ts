import { Injectable } from "@nestjs/common";
import { OrderStatus, SubscriptionStatus, TenantStatus } from "@nepthok/database";
import { PrismaService } from "../../prisma/prisma.service";
import { AnalyticsQueryDto } from "./dto/analytics-query.dto";

function resolveDateRange(query: AnalyticsQueryDto): { from: Date; to: Date } {
  const to = query.dateTo ? new Date(query.dateTo) : new Date();
  to.setHours(23, 59, 59, 999);

  if (query.dateFrom) {
    const from = new Date(query.dateFrom);
    from.setHours(0, 0, 0, 0);
    return { from, to };
  }

  const days = query.period === "7d" ? 7 : query.period === "90d" ? 90 : 30;
  const from = new Date(to);
  from.setDate(from.getDate() - days + 1);
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

function midnightUTC(d: Date): Date {
  const out = new Date(d);
  out.setUTCHours(0, 0, 0, 0);
  return out;
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(tenantId: string, query: AnalyticsQueryDto) {
    const { from, to } = resolveDateRange(query);

    const snapshots = await this.prisma.storeAnalytics.findMany({
      where: { tenantId, date: { gte: from, lte: to } },
      orderBy: { date: "asc" },
    });

    let totalOrders: number;
    let totalRevenue: number;

    if (snapshots.length > 0) {
      totalOrders = snapshots.reduce((s, r) => s + r.totalOrders, 0);
      totalRevenue = snapshots.reduce((s, r) => s + Number(r.totalRevenue), 0);
    } else {
      // Live fallback from Orders table
      const [orderAgg, revenueAgg] = await Promise.all([
        this.prisma.order.count({ where: { tenantId, createdAt: { gte: from, lte: to } } }),
        this.prisma.order.aggregate({
          where: { tenantId, status: OrderStatus.DELIVERED, createdAt: { gte: from, lte: to } },
          _sum: { total: true },
        }),
      ]);
      totalOrders = orderAgg;
      totalRevenue = Number(revenueAgg._sum.total ?? 0);
    }

    const totalProductViews = snapshots.reduce((s, r) => s + r.totalProductViews, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const [topProducts, recentOrders, lowStockProducts] = await Promise.all([
      this.prisma.orderItem.groupBy({
        by: ["productId", "productName"],
        where: { tenantId, order: { createdAt: { gte: from, lte: to } } },
        _sum: { quantity: true },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
      this.prisma.order.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          buyerName: true,
          total: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.$queryRaw<Array<{ id: string; name: string; sku: string | null; stock: number; lowStockThreshold: number }>>`
        SELECT id, name, sku, stock, "lowStockThreshold"
        FROM "Product"
        WHERE "tenantId" = ${tenantId}
          AND status = 'ACTIVE'
          AND stock <= "lowStockThreshold"
        ORDER BY stock ASC
        LIMIT 20
      `,
    ]);

    return {
      summary: {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        totalProductViews,
        conversionRate: null,
      },
      trend: snapshots,
      topProducts: topProducts.map((p) => ({
        productId: p.productId,
        productName: p.productName,
        orderCount: p._count.id,
        totalQuantity: p._sum.quantity ?? 0,
      })),
      recentOrders,
      lowStockProducts,
    };
  }

  async getPlatformOverview(query: AnalyticsQueryDto) {
    const { from, to } = resolveDateRange(query);

    const [
      totalTenants,
      activeTenants,
      pendingApproval,
      revenueAgg,
      totalOrders,
      activeSubscriptions,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { status: TenantStatus.ACTIVE } }),
      this.prisma.tenant.count({ where: { status: TenantStatus.PENDING } }),
      this.prisma.order.aggregate({
        where: { status: OrderStatus.DELIVERED, createdAt: { gte: from, lte: to } },
        _sum: { total: true },
      }),
      this.prisma.order.count({ where: { createdAt: { gte: from, lte: to } } }),
      this.prisma.subscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
    ]);

    const activeSubs = await this.prisma.subscription.findMany({
      where: { status: SubscriptionStatus.ACTIVE },
      include: { plan: { select: { price: true, tier: true } } },
    });

    const monthlyRecurringRevenue = activeSubs.reduce(
      (s, sub) => s + Number(sub.plan.price),
      0,
    );

    const basicCount = activeSubs.filter((s) => s.plan.tier === "BASIC").length;
    const proCount = activeSubs.filter((s) => s.plan.tier === "PRO").length;

    const [topTenants, recentTenants] = await Promise.all([
      this.prisma.order.groupBy({
        by: ["tenantId"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }).then(async (rows) => {
        const tenantIds = rows.map((r) => r.tenantId);
        const tenants = await this.prisma.tenant.findMany({
          where: { id: { in: tenantIds } },
          select: { id: true, name: true, slug: true },
        });
        return rows.map((r) => ({
          ...tenants.find((t) => t.id === r.tenantId),
          orderCount: r._count.id,
        }));
      }),
      this.prisma.tenant.findMany({
        where: { status: TenantStatus.ACTIVE },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: { id: true, name: true, slug: true, createdAt: true },
      }),
    ]);

    return {
      summary: {
        totalTenants,
        activeTenants,
        pendingApproval,
        totalRevenue: Number(revenueAgg._sum.total ?? 0),
        totalOrders,
        activeSubscriptions,
        monthlyRecurringRevenue,
      },
      topTenants,
      recentTenants,
      subscriptionBreakdown: { basic: basicCount, pro: proCount },
    };
  }

  async recordDailySnapshot(tenantId: string, date: Date) {
    const dayStart = midnightUTC(date);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const [ordersByStatus, revenueAgg] = await Promise.all([
      this.prisma.order.groupBy({
        by: ["status"],
        where: { tenantId, createdAt: { gte: dayStart, lt: dayEnd } },
        _count: { id: true },
      }),
      this.prisma.order.aggregate({
        where: { tenantId, status: OrderStatus.DELIVERED, createdAt: { gte: dayStart, lt: dayEnd } },
        _sum: { total: true },
      }),
    ]);

    const totalOrders = ordersByStatus.reduce((s, r) => s + r._count.id, 0);
    const newOrders =
      ordersByStatus.find((r) => r.status === OrderStatus.PENDING)?._count.id ?? 0;
    const cancelledOrders =
      ordersByStatus.find((r) => r.status === "CANCELLED")?._count.id ?? 0;
    const totalRevenue = Number(revenueAgg._sum.total ?? 0);

    return this.prisma.storeAnalytics.upsert({
      where: { tenantId_date: { tenantId, date: dayStart } },
      create: {
        tenantId,
        date: dayStart,
        totalOrders,
        totalRevenue,
        totalProductViews: 0,
        newOrders,
        cancelledOrders,
      },
      update: {
        totalOrders,
        totalRevenue,
        newOrders,
        cancelledOrders,
      },
    });
  }

  async recordAllTenantsSnapshot(date: Date) {
    const tenants = await this.prisma.tenant.findMany({
      where: { status: TenantStatus.ACTIVE },
      select: { id: true },
    });

    await Promise.all(tenants.map((t) => this.recordDailySnapshot(t.id, date)));
    return { snapshotsRecorded: tenants.length };
  }
}
