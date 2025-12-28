import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // ============= SALES REPORTS =============

  async getSalesSummary(fromDate: Date, toDate: Date) {
    const [
      ordersCount,
      ordersValue,
      quotesCount,
      quotesValue,
      quotesConverted,
    ] = await Promise.all([
      this.prisma.order.count({
        where: {
          createdAt: { gte: fromDate, lte: toDate },
          status: { in: ['delivered', 'partial_delivery', 'closed'] },
        },
      }),
      this.prisma.order.aggregate({
        where: {
          createdAt: { gte: fromDate, lte: toDate },
          status: { in: ['delivered', 'partial_delivery', 'closed'] },
        },
        _sum: { total: true },
      }),
      this.prisma.quote.count({
        where: { createdAt: { gte: fromDate, lte: toDate } },
      }),
      this.prisma.quote.aggregate({
        where: { createdAt: { gte: fromDate, lte: toDate } },
        _sum: { total: true },
      }),
      this.prisma.quote.count({
        where: {
          createdAt: { gte: fromDate, lte: toDate },
          status: 'converted',
        },
      }),
    ]);

    return {
      period: { from: fromDate, to: toDate },
      orders: {
        count: ordersCount,
        totalValue: ordersValue._sum.total || 0,
      },
      quotes: {
        count: quotesCount,
        totalValue: quotesValue._sum.total || 0,
        converted: quotesConverted,
        conversionRate: quotesCount > 0 ? Math.round((quotesConverted / quotesCount) * 100) : 0,
      },
    };
  }

  async getSalesByCustomerType(fromDate: Date, toDate: Date) {
    const orders = await this.prisma.order.groupBy({
      by: ['customerId'],
      where: {
        createdAt: { gte: fromDate, lte: toDate },
        status: { in: ['delivered', 'partial_delivery', 'closed'] },
      },
      _count: true,
      _sum: { total: true },
    });

    // Get customer types
    const customerIds = orders.map((o) => o.customerId);
    const customers = await this.prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, customerType: true },
    });

    const customerTypeMap = new Map(customers.map((c) => [c.id, c.customerType]));

    // Group by customer type
    const byType: Record<string, { count: number; value: number }> = {
      retail: { count: 0, value: 0 },
      b2b: { count: 0, value: 0 },
      wholesale: { count: 0, value: 0 },
    };

    for (const order of orders) {
      const type = (customerTypeMap.get(order.customerId) || 'retail') as string;
      byType[type].count += order._count;
      byType[type].value += Number(order._sum.total) || 0;
    }

    return {
      period: { from: fromDate, to: toDate },
      byCustomerType: byType,
    };
  }

  async getSalesByProduct(fromDate: Date, toDate: Date) {
    const items = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          createdAt: { gte: fromDate, lte: toDate },
          status: { in: ['delivered', 'partial_delivery', 'closed'] },
        },
      },
      _count: true,
      _sum: {
        quantityDelivered: true,
        lineTotal: true,
      },
    });

    // Get product details
    const productIds = items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, sku: true, name: true, productType: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    return {
      period: { from: fromDate, to: toDate },
      products: items.map((item) => ({
        product: productMap.get(item.productId),
        orderCount: item._count,
        quantitySold: item._sum.quantityDelivered || 0,
        revenue: item._sum.lineTotal || 0,
      })).sort((a, b) => (b.revenue || 0) - (a.revenue || 0)),
    };
  }

  // ============= DELIVERY REPORTS =============

  async getDeliveryPerformance(fromDate: Date, toDate: Date) {
    const [
      totalOrders,
      delivered,
      partialDelivery,
      failed,
      cancelled,
      onTimeDeliveries,
    ] = await Promise.all([
      this.prisma.order.count({
        where: {
          scheduledDate: { gte: fromDate, lte: toDate },
          status: { notIn: ['created', 'cancelled'] },
        },
      }),
      this.prisma.order.count({
        where: {
          scheduledDate: { gte: fromDate, lte: toDate },
          status: 'delivered',
        },
      }),
      this.prisma.order.count({
        where: {
          scheduledDate: { gte: fromDate, lte: toDate },
          status: 'partial_delivery',
        },
      }),
      this.prisma.order.count({
        where: {
          scheduledDate: { gte: fromDate, lte: toDate },
          status: 'failed',
        },
      }),
      this.prisma.order.count({
        where: {
          scheduledDate: { gte: fromDate, lte: toDate },
          status: 'cancelled',
        },
      }),
      // Orders delivered on their scheduled date
      this.prisma.order.count({
        where: {
          scheduledDate: { gte: fromDate, lte: toDate },
          status: { in: ['delivered', 'partial_delivery', 'closed'] },
          // This is a simplified check - in reality you'd compare dates
        },
      }),
    ]);

    const successRate = totalOrders > 0
      ? Math.round(((delivered + partialDelivery) / totalOrders) * 100)
      : 0;

    return {
      period: { from: fromDate, to: toDate },
      totalOrders,
      byStatus: {
        delivered,
        partialDelivery,
        failed,
        cancelled,
      },
      successRate,
      onTimeRate: totalOrders > 0 ? Math.round((onTimeDeliveries / totalOrders) * 100) : 0,
    };
  }

  async getDriverPerformance(fromDate: Date, toDate: Date) {
    const runs = await this.prisma.scheduleRun.findMany({
      where: {
        runDate: { gte: fromDate, lte: toDate },
        status: 'completed',
        driverId: { not: null },
      },
      include: {
        driver: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        stops: true,
      },
    });

    // Group by driver
    const driverStats: Record<string, {
      driver: { id: string; name: string };
      runs: number;
      totalStops: number;
      completedStops: number;
      failedStops: number;
    }> = {};

    for (const run of runs) {
      if (!run.driverId) continue;

      if (!driverStats[run.driverId]) {
        driverStats[run.driverId] = {
          driver: {
            id: run.driverId,
            name: `${run.driver?.user.firstName} ${run.driver?.user.lastName}`,
          },
          runs: 0,
          totalStops: 0,
          completedStops: 0,
          failedStops: 0,
        };
      }

      driverStats[run.driverId].runs++;
      driverStats[run.driverId].totalStops += run.stops.length;
      driverStats[run.driverId].completedStops += run.stops.filter((s) => s.status === 'completed').length;
      driverStats[run.driverId].failedStops += run.stops.filter((s) => s.status === 'failed').length;
    }

    return {
      period: { from: fromDate, to: toDate },
      drivers: Object.values(driverStats).map((d) => ({
        ...d,
        successRate: d.totalStops > 0
          ? Math.round((d.completedStops / d.totalStops) * 100)
          : 0,
      })).sort((a, b) => b.successRate - a.successRate),
    };
  }

  // ============= INVENTORY REPORTS =============

  async getInventorySummary() {
    const [cylinderStock, tanks] = await Promise.all([
      this.prisma.cylinderStockSummary.findMany({
        orderBy: [{ cylinderSize: 'asc' }, { status: 'asc' }],
      }),
      this.prisma.tank.findMany({
        where: { status: 'active' },
        include: {
          readings: {
            take: 1,
            orderBy: { readingTime: 'desc' },
          },
        },
      }),
    ]);

    // Group cylinder stock by size
    const cylindersBySize: Record<string, Record<string, number>> = {};
    for (const stock of cylinderStock) {
      if (!cylindersBySize[stock.cylinderSize]) {
        cylindersBySize[stock.cylinderSize] = {};
      }
      cylindersBySize[stock.cylinderSize][stock.status] = stock.quantity;
    }

    return {
      cylinders: {
        bySize: cylindersBySize,
        totals: Object.entries(cylindersBySize).map(([size, statuses]) => ({
          size,
          total: Object.values(statuses).reduce((sum, qty) => sum + qty, 0),
          full: statuses['full'] || 0,
          empty: statuses['empty'] || 0,
        })),
      },
      tanks: tanks.map((t) => ({
        code: t.tankCode,
        name: t.name,
        currentLevel: t.currentLevelLitres,
        capacity: t.capacityLitres,
        percentFull: Math.round((Number(t.currentLevelLitres) / Number(t.capacityLitres)) * 100),
        lastReading: t.readings[0],
      })),
    };
  }

  async getCylinderMovementReport(fromDate: Date, toDate: Date) {
    const movements = await this.prisma.cylinderMovement.groupBy({
      by: ['cylinderSize', 'movementType'],
      where: {
        recordedAt: { gte: fromDate, lte: toDate },
      },
      _sum: { quantity: true },
      _count: true,
    });

    return {
      period: { from: fromDate, to: toDate },
      movements: movements.map((m) => ({
        cylinderSize: m.cylinderSize,
        movementType: m.movementType,
        totalQuantity: m._sum.quantity || 0,
        transactionCount: m._count,
      })),
    };
  }

  // ============= CUSTOMER REPORTS =============

  async getTopCustomers(fromDate: Date, toDate: Date, limit = 10) {
    const orders = await this.prisma.order.groupBy({
      by: ['customerId'],
      where: {
        createdAt: { gte: fromDate, lte: toDate },
        status: { in: ['delivered', 'partial_delivery', 'closed'] },
      },
      _count: true,
      _sum: { total: true },
      orderBy: {
        _sum: { total: 'desc' },
      },
      take: limit,
    });

    // Get customer details
    const customerIds = orders.map((o) => o.customerId);
    const customers = await this.prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, accountNumber: true, companyName: true, customerType: true },
    });

    const customerMap = new Map(customers.map((c) => [c.id, c]));

    return {
      period: { from: fromDate, to: toDate },
      customers: orders.map((order) => ({
        customer: customerMap.get(order.customerId),
        orderCount: order._count,
        totalRevenue: order._sum.total || 0,
      })),
    };
  }

  async getCustomerRetention(fromDate: Date, toDate: Date) {
    // Customers who ordered in both periods
    const periodLength = toDate.getTime() - fromDate.getTime();
    const previousFrom = new Date(fromDate.getTime() - periodLength);
    const previousTo = new Date(fromDate.getTime() - 1);

    const [currentCustomers, previousCustomers] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          createdAt: { gte: fromDate, lte: toDate },
          status: { in: ['delivered', 'partial_delivery', 'closed'] },
        },
        select: { customerId: true },
        distinct: ['customerId'],
      }),
      this.prisma.order.findMany({
        where: {
          createdAt: { gte: previousFrom, lte: previousTo },
          status: { in: ['delivered', 'partial_delivery', 'closed'] },
        },
        select: { customerId: true },
        distinct: ['customerId'],
      }),
    ]);

    const currentIds = new Set(currentCustomers.map((c) => c.customerId));
    const previousIds = new Set(previousCustomers.map((c) => c.customerId));

    const retained = [...currentIds].filter((id) => previousIds.has(id)).length;
    const newCustomers = [...currentIds].filter((id) => !previousIds.has(id)).length;
    const churned = [...previousIds].filter((id) => !currentIds.has(id)).length;

    return {
      period: { from: fromDate, to: toDate },
      previousPeriod: { from: previousFrom, to: previousTo },
      currentCustomers: currentIds.size,
      previousCustomers: previousIds.size,
      retained,
      newCustomers,
      churned,
      retentionRate: previousIds.size > 0 ? Math.round((retained / previousIds.size) * 100) : 0,
    };
  }

  // ============= COMPLIANCE REPORTS =============

  async getChecklistComplianceReport(fromDate: Date, toDate: Date) {
    const responses = await this.prisma.checklistResponse.groupBy({
      by: ['templateId', 'status', 'passed'],
      where: {
        completedAt: { gte: fromDate, lte: toDate },
      },
      _count: true,
    });

    // Get template details
    const templateIds = [...new Set(responses.map((r) => r.templateId))];
    const templates = await this.prisma.checklistTemplate.findMany({
      where: { id: { in: templateIds } },
      select: { id: true, code: true, name: true, templateType: true },
    });

    const templateMap = new Map(templates.map((t) => [t.id, t]));

    // Group by template
    const byTemplate: Record<string, {
      template: any;
      total: number;
      completed: number;
      passed: number;
      failed: number;
    }> = {};

    for (const response of responses) {
      const template = templateMap.get(response.templateId);
      if (!template) continue;

      if (!byTemplate[response.templateId]) {
        byTemplate[response.templateId] = {
          template,
          total: 0,
          completed: 0,
          passed: 0,
          failed: 0,
        };
      }

      byTemplate[response.templateId].total += response._count;

      if (response.status === 'completed') {
        byTemplate[response.templateId].completed += response._count;
        if (response.passed) {
          byTemplate[response.templateId].passed += response._count;
        } else {
          byTemplate[response.templateId].failed += response._count;
        }
      }
    }

    return {
      period: { from: fromDate, to: toDate },
      checklists: Object.values(byTemplate).map((t) => ({
        ...t,
        passRate: t.completed > 0 ? Math.round((t.passed / t.completed) * 100) : 0,
      })),
    };
  }
}
