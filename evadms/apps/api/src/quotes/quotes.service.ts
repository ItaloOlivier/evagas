import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ProductsService } from '../products/products.service';
import {
  CreateQuoteDto,
  UpdateQuoteDto,
  QuoteItemDto,
  SendQuoteDto,
  AcceptQuoteDto,
  RejectQuoteDto,
} from './dto/quote.dto';

const VAT_RATE = 0.15;

// Quote state machine
const QUOTE_STATUS_FLOW: Record<string, string[]> = {
  draft: ['sent', 'expired'],
  sent: ['accepted', 'rejected', 'expired'],
  accepted: ['converted'],
  rejected: [],
  expired: [],
  converted: [],
};

@Injectable()
export class QuotesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private productsService: ProductsService,
  ) {}

  private canTransition(currentStatus: string, newStatus: string): boolean {
    const allowedTransitions = QUOTE_STATUS_FLOW[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    customerId?: string;
    fromDate?: string;
    toDate?: string;
  }) {
    const { page = 1, limit = 20, search, status, customerId, fromDate, toDate } = params;

    const where: any = {};

    if (search) {
      where.OR = [
        { quoteNumber: { contains: search, mode: 'insensitive' } },
        { prospectName: { contains: search, mode: 'insensitive' } },
        { prospectEmail: { contains: search, mode: 'insensitive' } },
        { customer: { companyName: { contains: search, mode: 'insensitive' } } },
        { customer: { accountNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }

    const [quotes, total] = await Promise.all([
      this.prisma.quote.findMany({
        where,
        include: {
          customer: {
            select: { id: true, accountNumber: true, companyName: true, primaryContactName: true },
          },
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
      this.prisma.quote.count({ where }),
    ]);

    return {
      data: quotes,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            sites: { where: { status: 'active' } },
            pricingTier: true,
          },
        },
        site: true,
        items: {
          include: { product: true },
          orderBy: { sortOrder: 'asc' },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        convertedOrder: {
          select: { id: true, orderNumber: true, status: true },
        },
      },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    return quote;
  }

  async findByQuoteNumber(quoteNumber: string) {
    return this.prisma.quote.findUnique({
      where: { quoteNumber },
      include: {
        customer: true,
        items: {
          include: { product: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async create(dto: CreateQuoteDto, createdById?: string) {
    // Generate quote number
    const year = new Date().getFullYear();
    const lastQuote = await this.prisma.quote.findFirst({
      where: { quoteNumber: { startsWith: `QT-${year}` } },
      orderBy: { quoteNumber: 'desc' },
      select: { quoteNumber: true },
    });

    let nextNumber = 1;
    if (lastQuote?.quoteNumber) {
      const match = lastQuote.quoteNumber.match(/QT-\d+-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    const quoteNumber = `QT-${year}-${nextNumber.toString().padStart(5, '0')}`;

    // Calculate line items with pricing
    const items = await this.calculateItems(dto.items, dto.customerId);
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const vatAmount = Math.round(subtotal * VAT_RATE * 100) / 100;
    const total = Math.round((subtotal + vatAmount) * 100) / 100;

    const quote = await this.prisma.quote.create({
      data: {
        quoteNumber,
        customerId: dto.customerId,
        prospectName: dto.prospectName,
        prospectPhone: dto.prospectPhone,
        prospectEmail: dto.prospectEmail?.toLowerCase(),
        siteId: dto.siteId,
        deliveryAddressText: dto.deliveryAddressText,
        subtotal,
        vatAmount,
        total,
        status: 'draft',
        notes: dto.notes,
        internalNotes: dto.internalNotes,
        createdById,
        items: {
          create: items.map((item, index) => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountPercentage: item.discountPercentage,
            lineTotal: item.lineTotal,
            sortOrder: index + 1,
          })),
        },
      },
      include: {
        customer: true,
        items: {
          include: { product: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    await this.auditService.log({
      eventType: 'QUOTE',
      eventSubtype: 'CREATE',
      action: 'CREATE',
      actorId: createdById,
      entityType: 'quote',
      entityId: quote.id,
      entityRef: quote.quoteNumber,
      summary: `Quote created: ${quote.quoteNumber} for R${total.toFixed(2)}`,
      newState: {
        quoteNumber: quote.quoteNumber,
        customer: dto.customerId || dto.prospectName,
        total,
        itemCount: items.length,
      },
    });

    return quote;
  }

  async update(id: string, dto: UpdateQuoteDto, updatedById?: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    if (quote.status !== 'draft') {
      throw new BadRequestException('Only draft quotes can be updated');
    }

    let updateData: any = {
      customerId: dto.customerId,
      prospectName: dto.prospectName,
      prospectPhone: dto.prospectPhone,
      prospectEmail: dto.prospectEmail?.toLowerCase(),
      siteId: dto.siteId,
      deliveryAddressText: dto.deliveryAddressText,
      notes: dto.notes,
      internalNotes: dto.internalNotes,
      updatedById,
    };

    // If items are provided, recalculate
    if (dto.items) {
      const items = await this.calculateItems(dto.items, dto.customerId || quote.customerId);
      const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
      const vatAmount = Math.round(subtotal * VAT_RATE * 100) / 100;
      const total = Math.round((subtotal + vatAmount) * 100) / 100;

      // Delete existing items and create new ones
      await this.prisma.quoteItem.deleteMany({ where: { quoteId: id } });

      updateData = {
        ...updateData,
        subtotal,
        vatAmount,
        total,
        items: {
          create: items.map((item, index) => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountPercentage: item.discountPercentage,
            lineTotal: item.lineTotal,
            sortOrder: index + 1,
          })),
        },
      };
    }

    const updatedQuote = await this.prisma.quote.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        items: {
          include: { product: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    await this.auditService.log({
      eventType: 'QUOTE',
      eventSubtype: 'UPDATE',
      action: 'UPDATE',
      actorId: updatedById,
      entityType: 'quote',
      entityId: id,
      entityRef: quote.quoteNumber,
      summary: `Quote updated: ${quote.quoteNumber}`,
      previousState: { total: quote.total },
      newState: { total: updatedQuote.total },
    });

    return updatedQuote;
  }

  async send(id: string, dto: SendQuoteDto, sentById?: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    if (!this.canTransition(quote.status, 'sent')) {
      throw new BadRequestException(`Cannot send quote from status: ${quote.status}`);
    }

    const validDays = dto.validDays || 7;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    const updatedQuote = await this.prisma.quote.update({
      where: { id },
      data: {
        status: 'sent',
        issuedDate: new Date(),
        validUntil,
        updatedById: sentById,
      },
      include: {
        customer: true,
        items: {
          include: { product: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    await this.auditService.log({
      eventType: 'QUOTE',
      eventSubtype: 'SEND',
      action: 'UPDATE',
      actorId: sentById,
      entityType: 'quote',
      entityId: id,
      entityRef: quote.quoteNumber,
      summary: `Quote sent: ${quote.quoteNumber} via ${dto.channel || 'email'}`,
      newState: {
        status: 'sent',
        validUntil,
        channel: dto.channel,
      },
    });

    // TODO: Trigger notification service to send quote

    return updatedQuote;
  }

  async accept(id: string, dto: AcceptQuoteDto, acceptedById?: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: { customer: true, items: true },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    if (!this.canTransition(quote.status, 'accepted')) {
      throw new BadRequestException(`Cannot accept quote from status: ${quote.status}`);
    }

    // Check if quote is expired
    if (quote.validUntil && new Date() > quote.validUntil) {
      await this.prisma.quote.update({
        where: { id },
        data: { status: 'expired' },
      });
      throw new BadRequestException('Quote has expired');
    }

    const updatedQuote = await this.prisma.quote.update({
      where: { id },
      data: {
        status: 'accepted',
        updatedById: acceptedById,
      },
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
      },
    });

    await this.auditService.log({
      eventType: 'QUOTE',
      eventSubtype: 'ACCEPT',
      action: 'UPDATE',
      actorId: acceptedById,
      entityType: 'quote',
      entityId: id,
      entityRef: quote.quoteNumber,
      summary: `Quote accepted: ${quote.quoteNumber}`,
      newState: {
        status: 'accepted',
        requestedDate: dto.requestedDeliveryDate,
        paymentMethod: dto.paymentMethod,
      },
    });

    return updatedQuote;
  }

  async reject(id: string, dto: RejectQuoteDto, rejectedById?: string) {
    const quote = await this.prisma.quote.findUnique({ where: { id } });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    if (!this.canTransition(quote.status, 'rejected')) {
      throw new BadRequestException(`Cannot reject quote from status: ${quote.status}`);
    }

    const updatedQuote = await this.prisma.quote.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectionReason: dto.reason,
        updatedById: rejectedById,
      },
    });

    await this.auditService.log({
      eventType: 'QUOTE',
      eventSubtype: 'REJECT',
      action: 'UPDATE',
      actorId: rejectedById,
      entityType: 'quote',
      entityId: id,
      entityRef: quote.quoteNumber,
      summary: `Quote rejected: ${quote.quoteNumber} - ${dto.reason}`,
      newState: {
        status: 'rejected',
        rejectionReason: dto.reason,
      },
    });

    return updatedQuote;
  }

  async convertToOrder(id: string, convertedById?: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: {
        customer: true,
        site: true,
        items: { include: { product: true } },
      },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    if (!this.canTransition(quote.status, 'converted')) {
      throw new BadRequestException(`Cannot convert quote from status: ${quote.status}`);
    }

    if (!quote.customerId) {
      throw new BadRequestException('Quote must be linked to a customer before conversion');
    }

    if (!quote.siteId) {
      throw new BadRequestException('Quote must have a delivery site before conversion');
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

    // Create order from quote
    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        customerId: quote.customerId,
        siteId: quote.siteId,
        quoteId: quote.id,
        orderType: 'cylinder_delivery', // Default, can be updated
        subtotal: quote.subtotal,
        vatAmount: quote.vatAmount,
        deliveryFee: 0, // Add delivery fee logic
        total: quote.total,
        paymentMethod: 'cod', // Default
        paymentStatus: 'pending',
        status: 'created',
        deliveryInstructions: quote.site?.deliveryInstructions,
        notes: quote.notes,
        internalNotes: quote.internalNotes,
        createdById: convertedById,
        items: {
          create: quote.items.map((item, index) => ({
            productId: item.productId,
            quantityOrdered: item.quantity,
            quantityDelivered: 0,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            emptiesExpected: item.product.productType === 'cylinder' ? item.quantity : 0,
            emptiesCollected: 0,
            sortOrder: index + 1,
          })),
        },
      },
      include: {
        customer: true,
        site: true,
        items: { include: { product: true } },
      },
    });

    // Update quote status
    await this.prisma.quote.update({
      where: { id },
      data: {
        status: 'converted',
        convertedToOrderId: order.id,
        updatedById: convertedById,
      },
    });

    await this.auditService.log({
      eventType: 'QUOTE',
      eventSubtype: 'CONVERT',
      action: 'UPDATE',
      actorId: convertedById,
      entityType: 'quote',
      entityId: id,
      entityRef: quote.quoteNumber,
      summary: `Quote converted to order: ${quote.quoteNumber} → ${orderNumber}`,
      newState: {
        status: 'converted',
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    });

    return order;
  }

  async expire(id: string) {
    const quote = await this.prisma.quote.findUnique({ where: { id } });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    if (!this.canTransition(quote.status, 'expired')) {
      throw new BadRequestException(`Cannot expire quote from status: ${quote.status}`);
    }

    const updatedQuote = await this.prisma.quote.update({
      where: { id },
      data: { status: 'expired' },
    });

    await this.auditService.log({
      eventType: 'QUOTE',
      eventSubtype: 'EXPIRE',
      action: 'UPDATE',
      entityType: 'quote',
      entityId: id,
      entityRef: quote.quoteNumber,
      summary: `Quote expired: ${quote.quoteNumber}`,
    });

    return updatedQuote;
  }

  // Helper to calculate item prices
  private async calculateItems(
    items: QuoteItemDto[],
    customerId?: string,
  ): Promise<Array<{
    productId: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    discountPercentage: number;
    lineTotal: number;
  }>> {
    const calculatedItems = [];

    for (const item of items) {
      const priceInfo = await this.productsService.getEffectivePrice(
        item.productId,
        customerId,
        item.quantity,
      );

      const unitPrice = item.unitPrice ?? priceInfo.effectivePrice;
      const discountPercentage = item.discountPercentage ?? 0;
      const priceAfterDiscount = unitPrice * (1 - discountPercentage / 100);
      const lineTotal = Math.round(priceAfterDiscount * item.quantity * 100) / 100;

      calculatedItems.push({
        productId: item.productId,
        description: item.description || priceInfo.productName,
        quantity: item.quantity,
        unitPrice,
        discountPercentage,
        lineTotal,
      });
    }

    return calculatedItems;
  }

  // Batch expire quotes that have passed their valid until date
  async expireOverdueQuotes() {
    const expiredQuotes = await this.prisma.quote.findMany({
      where: {
        status: 'sent',
        validUntil: { lt: new Date() },
      },
    });

    for (const quote of expiredQuotes) {
      await this.expire(quote.id);
    }

    return { expiredCount: expiredQuotes.length };
  }

  // Get quote statistics
  async getStatistics(fromDate?: Date, toDate?: Date) {
    const where: any = {};
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = fromDate;
      if (toDate) where.createdAt.lte = toDate;
    }

    const [
      total,
      draft,
      sent,
      accepted,
      rejected,
      expired,
      converted,
      totalValue,
    ] = await Promise.all([
      this.prisma.quote.count({ where }),
      this.prisma.quote.count({ where: { ...where, status: 'draft' } }),
      this.prisma.quote.count({ where: { ...where, status: 'sent' } }),
      this.prisma.quote.count({ where: { ...where, status: 'accepted' } }),
      this.prisma.quote.count({ where: { ...where, status: 'rejected' } }),
      this.prisma.quote.count({ where: { ...where, status: 'expired' } }),
      this.prisma.quote.count({ where: { ...where, status: 'converted' } }),
      this.prisma.quote.aggregate({
        where,
        _sum: { total: true },
      }),
    ]);

    const conversionRate = sent > 0 ? Math.round((converted / sent) * 100) : 0;

    return {
      total,
      byStatus: { draft, sent, accepted, rejected, expired, converted },
      totalValue: totalValue._sum.total || 0,
      conversionRate,
    };
  }
}
