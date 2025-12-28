import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ProductsService } from '../products/products.service';
import {
  CreateOrderDto,
  UpdateOrderDto,
  ScheduleOrderDto,
  DispatchOrderDto,
  CompleteDeliveryDto,
  FailDeliveryDto,
  CancelOrderDto,
  UpdatePaymentDto,
} from './dto/order.dto';

const VAT_RATE = 0.15;

// Order state machine
const ORDER_STATUS_FLOW: Record<string, string[]> = {
  created: ['scheduled', 'cancelled'],
  scheduled: ['prepared', 'created', 'cancelled'],
  prepared: ['loading', 'scheduled', 'cancelled'],
  loading: ['dispatched', 'prepared', 'cancelled'],
  dispatched: ['in_transit', 'loading'],
  in_transit: ['arrived', 'dispatched'],
  arrived: ['delivered', 'partial_delivery', 'failed'],
  delivered: ['closed'],
  partial_delivery: ['closed', 'scheduled'],
  failed: ['scheduled', 'cancelled', 'closed'],
  cancelled: [],
  closed: [],
};

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private productsService: ProductsService,
  ) {}

  private canTransition(currentStatus: string, newStatus: string): boolean {
    const allowedTransitions = ORDER_STATUS_FLOW[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    orderType?: string;
    paymentStatus?: string;
    customerId?: string;
    driverId?: string;
    scheduledDate?: string;
    fromDate?: string;
    toDate?: string;
  }) {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      orderType,
      paymentStatus,
      customerId,
      driverId,
      scheduledDate,
      fromDate,
      toDate,
    } = params;

    const where: any = {};

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customer: { companyName: { contains: search, mode: 'insensitive' } } },
        { customer: { accountNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) where.status = status;
    if (orderType) where.orderType = orderType;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (customerId) where.customerId = customerId;

    if (scheduledDate) {
      const date = new Date(scheduledDate);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      where.scheduledDate = { gte: date, lt: nextDay };
    }

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }

    // Filter by driver through route stops
    if (driverId) {
      where.routeStops = {
        some: {
          run: { driverId },
        },
      };
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          customer: {
            select: { id: true, accountNumber: true, companyName: true, primaryContactName: true, primaryPhone: true },
          },
          site: true,
          items: {
            include: { product: true },
            orderBy: { sortOrder: 'asc' },
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            sites: { where: { status: 'active' } },
          },
        },
        site: true,
        quote: {
          select: { id: true, quoteNumber: true },
        },
        items: {
          include: { product: true },
          orderBy: { sortOrder: 'asc' },
        },
        routeStop: {
          include: {
            run: {
              include: {
                driver: { include: { user: { select: { firstName: true, lastName: true } } } },
                vehicle: true,
              },
            },
          },
        },
        podData: {
          include: { photos: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        completedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async findByOrderNumber(orderNumber: string) {
    return this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        customer: true,
        site: true,
        items: {
          include: { product: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async create(dto: CreateOrderDto, createdById?: string) {
    // Validate customer and site
    const [customer, site] = await Promise.all([
      this.prisma.customer.findUnique({ where: { id: dto.customerId } }),
      this.prisma.customerSite.findUnique({ where: { id: dto.siteId } }),
    ]);

    if (!customer) throw new NotFoundException('Customer not found');
    if (!site) throw new NotFoundException('Site not found');
    if (site.customerId !== dto.customerId) {
      throw new BadRequestException('Site does not belong to this customer');
    }

    // Generate order number
    const year = new Date().getFullYear();
    const lastOrder = await this.prisma.order.findFirst({
      where: { orderNumber: { startsWith: `ORD-${year}` } },
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    });

    let nextNumber = 1;
    if (lastOrder?.orderNumber) {
      const match = lastOrder.orderNumber.match(/ORD-\d+-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    const orderNumber = `ORD-${year}-${nextNumber.toString().padStart(5, '0')}`;

    // Calculate line items with pricing
    const items = await this.calculateItems(dto.items, dto.customerId);
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const deliveryFee = 0; // TODO: Calculate based on distance/order type
    const vatAmount = Math.round((subtotal + deliveryFee) * VAT_RATE * 100) / 100;
    const total = Math.round((subtotal + deliveryFee + vatAmount) * 100) / 100;

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        customerId: dto.customerId,
        siteId: dto.siteId,
        quoteId: dto.quoteId,
        orderType: dto.orderType as any,
        requestedDate: dto.requestedDate ? new Date(dto.requestedDate) : null,
        requestedWindow: dto.requestedWindow,
        subtotal,
        vatAmount,
        deliveryFee,
        total,
        paymentMethod: (dto.paymentMethod || 'cod') as any,
        paymentStatus: 'pending',
        status: 'created',
        deliveryInstructions: dto.deliveryInstructions || site.deliveryInstructions,
        specialRequirements: dto.specialRequirements,
        notes: dto.notes,
        internalNotes: dto.internalNotes,
        createdById,
        items: {
          create: items.map((item, index) => ({
            productId: item.productId,
            quantityOrdered: item.quantity,
            quantityDelivered: 0,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            emptiesExpected: item.emptiesExpected,
            emptiesCollected: 0,
            sortOrder: index + 1,
          })),
        },
      },
      include: {
        customer: true,
        site: true,
        items: {
          include: { product: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    await this.auditService.log({
      eventType: 'ORDER',
      eventSubtype: 'CREATE',
      action: 'CREATE',
      actorId: createdById,
      entityType: 'order',
      entityId: order.id,
      entityRef: order.orderNumber,
      summary: `Order created: ${order.orderNumber} for ${customer.companyName || customer.accountNumber}`,
      newState: {
        orderNumber: order.orderNumber,
        customer: customer.accountNumber,
        total,
        itemCount: items.length,
      },
    });

    return order;
  }

  async update(id: string, dto: UpdateOrderDto, updatedById?: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!['created', 'scheduled'].includes(order.status)) {
      throw new BadRequestException('Order can only be updated in created or scheduled status');
    }

    if (dto.siteId) {
      const site = await this.prisma.customerSite.findUnique({ where: { id: dto.siteId } });
      if (!site || site.customerId !== order.customerId) {
        throw new BadRequestException('Invalid site for this customer');
      }
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        siteId: dto.siteId,
        orderType: dto.orderType as any,
        requestedDate: dto.requestedDate ? new Date(dto.requestedDate) : undefined,
        requestedWindow: dto.requestedWindow,
        paymentMethod: dto.paymentMethod as any,
        deliveryInstructions: dto.deliveryInstructions,
        specialRequirements: dto.specialRequirements,
        notes: dto.notes,
        internalNotes: dto.internalNotes,
        updatedById,
      },
      include: {
        customer: true,
        site: true,
        items: {
          include: { product: true },
        },
      },
    });

    await this.auditService.log({
      eventType: 'ORDER',
      eventSubtype: 'UPDATE',
      action: 'UPDATE',
      actorId: updatedById,
      entityType: 'order',
      entityId: id,
      entityRef: order.orderNumber,
      summary: `Order updated: ${order.orderNumber}`,
    });

    return updatedOrder;
  }

  async schedule(id: string, dto: ScheduleOrderDto, scheduledById?: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!this.canTransition(order.status, 'scheduled')) {
      throw new BadRequestException(`Cannot schedule order from status: ${order.status}`);
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: 'scheduled',
        scheduledDate: new Date(dto.scheduledDate),
        scheduledRouteId: dto.routeId,
        updatedById: scheduledById,
      },
    });

    await this.auditService.log({
      eventType: 'ORDER',
      eventSubtype: 'SCHEDULE',
      action: 'UPDATE',
      actorId: scheduledById,
      entityType: 'order',
      entityId: id,
      entityRef: order.orderNumber,
      summary: `Order scheduled: ${order.orderNumber} for ${dto.scheduledDate}`,
      newState: {
        status: 'scheduled',
        scheduledDate: dto.scheduledDate,
      },
    });

    return updatedOrder;
  }

  async prepare(id: string, preparedById?: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!this.canTransition(order.status, 'prepared')) {
      throw new BadRequestException(`Cannot prepare order from status: ${order.status}`);
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: 'prepared',
        updatedById: preparedById,
      },
    });

    await this.auditService.log({
      eventType: 'ORDER',
      eventSubtype: 'PREPARE',
      action: 'UPDATE',
      actorId: preparedById,
      entityType: 'order',
      entityId: id,
      entityRef: order.orderNumber,
      summary: `Order prepared: ${order.orderNumber}`,
      newState: { status: 'prepared' },
    });

    return updatedOrder;
  }

  async load(id: string, loadedById?: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!this.canTransition(order.status, 'loading')) {
      throw new BadRequestException(`Cannot load order from status: ${order.status}`);
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: 'loading',
        updatedById: loadedById,
      },
    });

    await this.auditService.log({
      eventType: 'ORDER',
      eventSubtype: 'LOAD',
      action: 'UPDATE',
      actorId: loadedById,
      entityType: 'order',
      entityId: id,
      entityRef: order.orderNumber,
      summary: `Order loading: ${order.orderNumber}`,
      newState: { status: 'loading' },
    });

    return updatedOrder;
  }

  async dispatch(id: string, dto: DispatchOrderDto, dispatchedById?: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!this.canTransition(order.status, 'dispatched')) {
      throw new BadRequestException(`Cannot dispatch order from status: ${order.status}`);
    }

    // Validate driver and vehicle
    const [driver, vehicle] = await Promise.all([
      this.prisma.driver.findUnique({ where: { id: dto.driverId } }),
      this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } }),
    ]);

    if (!driver) throw new NotFoundException('Driver not found');
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: 'dispatched',
        updatedById: dispatchedById,
      },
    });

    await this.auditService.log({
      eventType: 'ORDER',
      eventSubtype: 'DISPATCH',
      action: 'UPDATE',
      actorId: dispatchedById,
      entityType: 'order',
      entityId: id,
      entityRef: order.orderNumber,
      summary: `Order dispatched: ${order.orderNumber}`,
      newState: {
        status: 'dispatched',
        driverId: dto.driverId,
        vehicleId: dto.vehicleId,
      },
    });

    return updatedOrder;
  }

  async startTransit(id: string, startedById?: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!this.canTransition(order.status, 'in_transit')) {
      throw new BadRequestException(`Cannot start transit from status: ${order.status}`);
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: 'in_transit',
        updatedById: startedById,
      },
    });

    await this.auditService.log({
      eventType: 'ORDER',
      eventSubtype: 'IN_TRANSIT',
      action: 'UPDATE',
      actorId: startedById,
      entityType: 'order',
      entityId: id,
      entityRef: order.orderNumber,
      summary: `Order in transit: ${order.orderNumber}`,
      newState: { status: 'in_transit' },
    });

    return updatedOrder;
  }

  async arrive(id: string, arrivedById?: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!this.canTransition(order.status, 'arrived')) {
      throw new BadRequestException(`Cannot mark arrival from status: ${order.status}`);
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: 'arrived',
        updatedById: arrivedById,
      },
    });

    await this.auditService.log({
      eventType: 'ORDER',
      eventSubtype: 'ARRIVED',
      action: 'UPDATE',
      actorId: arrivedById,
      entityType: 'order',
      entityId: id,
      entityRef: order.orderNumber,
      summary: `Order arrived at destination: ${order.orderNumber}`,
      newState: { status: 'arrived' },
    });

    return updatedOrder;
  }

  async completeDelivery(id: string, dto: CompleteDeliveryDto, completedById?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!['arrived'].includes(order.status)) {
      throw new BadRequestException(`Cannot complete delivery from status: ${order.status}`);
    }

    // Update each item's delivered quantities
    for (const itemUpdate of dto.items) {
      await this.prisma.orderItem.update({
        where: { id: itemUpdate.orderItemId },
        data: {
          quantityDelivered: itemUpdate.quantityDelivered,
          emptiesCollected: itemUpdate.emptiesCollected || 0,
        },
      });
    }

    // Determine if full or partial delivery
    const updatedItems = await this.prisma.orderItem.findMany({
      where: { orderId: id },
    });

    const isFullDelivery = updatedItems.every(
      (item) => item.quantityDelivered >= item.quantityOrdered,
    );

    const newStatus = isFullDelivery ? 'delivered' : 'partial_delivery';

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: newStatus,
        completedAt: new Date(),
        completedById,
        updatedById: completedById,
      },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    await this.auditService.log({
      eventType: 'ORDER',
      eventSubtype: isFullDelivery ? 'DELIVER' : 'PARTIAL_DELIVER',
      action: 'UPDATE',
      actorId: completedById,
      entityType: 'order',
      entityId: id,
      entityRef: order.orderNumber,
      summary: `Order ${isFullDelivery ? 'delivered' : 'partially delivered'}: ${order.orderNumber}`,
      newState: {
        status: newStatus,
        deliveredItems: dto.items,
      },
    });

    return updatedOrder;
  }

  async failDelivery(id: string, dto: FailDeliveryDto, failedById?: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!this.canTransition(order.status, 'failed')) {
      throw new BadRequestException(`Cannot fail delivery from status: ${order.status}`);
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: 'failed',
        exceptionType: 'delivery_failed',
        exceptionNotes: dto.reason + (dto.notes ? ` - ${dto.notes}` : ''),
        updatedById: failedById,
      },
    });

    await this.auditService.log({
      eventType: 'ORDER',
      eventSubtype: 'FAIL',
      action: 'UPDATE',
      actorId: failedById,
      entityType: 'order',
      entityId: id,
      entityRef: order.orderNumber,
      summary: `Order delivery failed: ${order.orderNumber} - ${dto.reason}`,
      newState: {
        status: 'failed',
        reason: dto.reason,
      },
    });

    return updatedOrder;
  }

  async cancel(id: string, dto: CancelOrderDto, cancelledById?: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!this.canTransition(order.status, 'cancelled')) {
      throw new BadRequestException(`Cannot cancel order from status: ${order.status}`);
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: 'cancelled',
        exceptionType: 'cancelled',
        exceptionNotes: dto.reason,
        updatedById: cancelledById,
      },
    });

    await this.auditService.log({
      eventType: 'ORDER',
      eventSubtype: 'CANCEL',
      action: 'UPDATE',
      actorId: cancelledById,
      entityType: 'order',
      entityId: id,
      entityRef: order.orderNumber,
      summary: `Order cancelled: ${order.orderNumber} - ${dto.reason}`,
      newState: {
        status: 'cancelled',
        reason: dto.reason,
      },
    });

    return updatedOrder;
  }

  async close(id: string, closedById?: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!this.canTransition(order.status, 'closed')) {
      throw new BadRequestException(`Cannot close order from status: ${order.status}`);
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: 'closed',
        updatedById: closedById,
      },
    });

    await this.auditService.log({
      eventType: 'ORDER',
      eventSubtype: 'CLOSE',
      action: 'UPDATE',
      actorId: closedById,
      entityType: 'order',
      entityId: id,
      entityRef: order.orderNumber,
      summary: `Order closed: ${order.orderNumber}`,
      newState: { status: 'closed' },
    });

    return updatedOrder;
  }

  async updatePayment(id: string, dto: UpdatePaymentDto, updatedById?: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        paymentStatus: dto.paymentStatus as any,
        updatedById,
      },
    });

    await this.auditService.log({
      eventType: 'ORDER',
      eventSubtype: 'PAYMENT_UPDATE',
      action: 'UPDATE',
      actorId: updatedById,
      entityType: 'order',
      entityId: id,
      entityRef: order.orderNumber,
      summary: `Payment status updated: ${order.orderNumber} → ${dto.paymentStatus}`,
      previousState: { paymentStatus: order.paymentStatus },
      newState: { paymentStatus: dto.paymentStatus },
    });

    return updatedOrder;
  }

  // Helper to calculate item prices
  private async calculateItems(
    items: Array<{ productId: string; quantity: number; unitPrice?: number; emptiesExpected?: number }>,
    customerId: string,
  ): Promise<Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    emptiesExpected: number;
  }>> {
    const calculatedItems = [];

    for (const item of items) {
      const priceInfo = await this.productsService.getEffectivePrice(
        item.productId,
        customerId,
        item.quantity,
      );

      const unitPrice = item.unitPrice ?? priceInfo.effectivePrice;
      const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;

      calculatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
        emptiesExpected: item.emptiesExpected ?? (priceInfo.productName.includes('Cylinder') ? item.quantity : 0),
      });
    }

    return calculatedItems;
  }

  // Get orders ready for dispatch today
  async getReadyForDispatch(date?: Date) {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.order.findMany({
      where: {
        status: { in: ['prepared', 'loading'] },
        scheduledDate: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        customer: { select: { accountNumber: true, companyName: true } },
        site: true,
        items: { include: { product: true } },
      },
      orderBy: { scheduledDate: 'asc' },
    });
  }

  // Get order statistics
  async getStatistics(fromDate?: Date, toDate?: Date) {
    const where: any = {};
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = fromDate;
      if (toDate) where.createdAt.lte = toDate;
    }

    const [
      total,
      created,
      scheduled,
      dispatched,
      delivered,
      failed,
      cancelled,
      totalValue,
      deliveredValue,
    ] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.count({ where: { ...where, status: 'created' } }),
      this.prisma.order.count({ where: { ...where, status: 'scheduled' } }),
      this.prisma.order.count({ where: { ...where, status: { in: ['dispatched', 'in_transit', 'arrived'] } } }),
      this.prisma.order.count({ where: { ...where, status: { in: ['delivered', 'partial_delivery', 'closed'] } } }),
      this.prisma.order.count({ where: { ...where, status: 'failed' } }),
      this.prisma.order.count({ where: { ...where, status: 'cancelled' } }),
      this.prisma.order.aggregate({ where, _sum: { total: true } }),
      this.prisma.order.aggregate({
        where: { ...where, status: { in: ['delivered', 'partial_delivery', 'closed'] } },
        _sum: { total: true },
      }),
    ]);

    const deliveryRate = (created + scheduled + dispatched + delivered + failed) > 0
      ? Math.round((delivered / (created + scheduled + dispatched + delivered + failed)) * 100)
      : 0;

    return {
      total,
      byStatus: { created, scheduled, dispatched, delivered, failed, cancelled },
      totalValue: totalValue._sum.total || 0,
      deliveredValue: deliveredValue._sum.total || 0,
      deliveryRate,
    };
  }
}
