import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { InventoryService } from '../inventory/inventory.service';
import {
  CreatePODDto,
  AddSignatureDto,
  FailedDeliveryDto,
  AddPhotoDto,
  PODOutcome,
} from './dto/pod.dto';

@Injectable()
export class PODService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private inventoryService: InventoryService,
  ) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    orderId?: string;
    outcome?: PODOutcome;
    signatureCaptured?: boolean;
    fromDate?: string;
    toDate?: string;
  }) {
    const { page = 1, limit = 20, orderId, outcome, signatureCaptured, fromDate, toDate } = params;

    const where: any = {};

    if (orderId) where.orderId = orderId;
    if (outcome) where.outcome = outcome;
    if (signatureCaptured !== undefined) where.signatureCaptured = signatureCaptured;

    if (fromDate || toDate) {
      where.completionTime = {};
      if (fromDate) where.completionTime.gte = new Date(fromDate);
      if (toDate) where.completionTime.lte = new Date(toDate);
    }

    const [pods, total] = await Promise.all([
      this.prisma.pODData.findMany({
        where,
        include: {
          order: {
            include: {
              customer: { select: { accountNumber: true, companyName: true } },
              site: true,
            },
          },
          photos: true,
          capturedByUser: { select: { firstName: true, lastName: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { completionTime: 'desc' },
      }),
      this.prisma.pODData.count({ where }),
    ]);

    return {
      data: pods,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const pod = await this.prisma.pODData.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: true,
            site: true,
            items: { include: { product: true } },
          },
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
        photos: true,
        capturedByUser: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    if (!pod) {
      throw new NotFoundException('POD not found');
    }

    return pod;
  }

  async findByOrder(orderId: string) {
    return this.prisma.pODData.findFirst({
      where: { orderId },
      include: {
        photos: true,
        capturedByUser: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async createPOD(dto: CreatePODDto, capturedById: string) {
    // Validate order exists and is in correct status
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        items: { include: { product: true } },
        customer: true,
        site: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!['arrived', 'dispatched', 'in_transit'].includes(order.status)) {
      throw new BadRequestException(`Cannot create POD for order in status: ${order.status}`);
    }

    // Check if POD already exists
    const existingPOD = await this.prisma.pODData.findFirst({
      where: { orderId: dto.orderId },
    });

    if (existingPOD) {
      throw new BadRequestException('POD already exists for this order');
    }

    // Update order items with delivered quantities
    for (const item of dto.items) {
      await this.prisma.orderItem.update({
        where: { id: item.orderItemId },
        data: {
          quantityDelivered: item.quantityDelivered,
          emptiesCollected: item.emptiesCollected || 0,
        },
      });

      // Record cylinder movements for empties collected
      if (item.emptiesCollected && item.emptiesCollected > 0) {
        const orderItem = order.items.find((oi) => oi.id === item.orderItemId);
        if (orderItem && orderItem.product.productType === 'cylinder' && orderItem.product.cylinderSizeKg) {
          await this.inventoryService.createMovement(
            {
              cylinderSize: `${orderItem.product.cylinderSizeKg}kg` as any,
              movementType: 'collect_empty',
              quantity: item.emptiesCollected,
              orderId: dto.orderId,
              reason: `Empties collected from ${order.customer.companyName || order.customer.accountNumber}`,
            },
            capturedById,
          );
        }
      }
    }

    // Determine if full or partial delivery
    const updatedItems = await this.prisma.orderItem.findMany({
      where: { orderId: dto.orderId },
    });

    const isFullDelivery = updatedItems.every(
      (item) => item.quantityDelivered >= item.quantityOrdered,
    );

    const orderStatus = dto.outcome === 'delivered' && isFullDelivery
      ? 'delivered'
      : dto.outcome === 'partial' || !isFullDelivery
        ? 'partial_delivery'
        : 'failed';

    // Create POD record
    const pod = await this.prisma.pODData.create({
      data: {
        orderId: dto.orderId,
        routeStopId: dto.routeStopId,
        arrivalTime: new Date(),
        completionTime: new Date(),
        gpsLatitude: dto.gpsLatitude,
        gpsLongitude: dto.gpsLongitude,
        gpsAccuracyMeters: dto.gpsAccuracyMeters,
        signatureCaptured: false,
        outcome: dto.outcome,
        outcomeNotes: dto.outcomeNotes,
        receivedByName: dto.receivedByName,
        receivedByPhone: dto.receivedByPhone,
        driverNotes: dto.driverNotes,
        deviceId: dto.deviceId,
        appVersion: dto.appVersion,
        capturedBy: capturedById,
        photos: dto.photos
          ? {
              create: dto.photos.map((photo, index) => ({
                photoType: photo.photoType,
                attachmentId: photo.attachmentId,
                caption: photo.caption,
                sequenceNumber: index + 1,
              })),
            }
          : undefined,
      },
      include: {
        photos: true,
        order: true,
      },
    });

    // Update order status
    await this.prisma.order.update({
      where: { id: dto.orderId },
      data: {
        status: orderStatus,
        completedAt: ['delivered', 'partial_delivery'].includes(orderStatus) ? new Date() : null,
        completedById: capturedById,
      },
    });

    // Update route stop if provided
    if (dto.routeStopId) {
      await this.prisma.routeStop.update({
        where: { id: dto.routeStopId },
        data: {
          status: 'completed',
          actualArrival: pod.arrivalTime,
          actualDeparture: pod.completionTime,
        },
      });

      // Increment completed stops on run
      const stop = await this.prisma.routeStop.findUnique({
        where: { id: dto.routeStopId },
      });
      if (stop) {
        await this.prisma.scheduleRun.update({
          where: { id: stop.runId },
          data: { completedStops: { increment: 1 } },
        });
      }
    }

    await this.auditService.log({
      eventType: 'POD',
      eventSubtype: 'CAPTURE',
      action: 'CREATE',
      actorId: capturedById,
      entityType: 'pod',
      entityId: pod.id,
      entityRef: order.orderNumber,
      summary: `POD captured: ${order.orderNumber} - ${dto.outcome}`,
      newState: {
        orderId: dto.orderId,
        outcome: dto.outcome,
        photoCount: dto.photos?.length || 0,
      },
      gpsLatitude: dto.gpsLatitude,
      gpsLongitude: dto.gpsLongitude,
    });

    return pod;
  }

  async addSignature(podId: string, dto: AddSignatureDto, addedById: string) {
    const pod = await this.prisma.pODData.findUnique({
      where: { id: podId },
      include: { order: true },
    });

    if (!pod) {
      throw new NotFoundException('POD not found');
    }

    if (pod.signatureCaptured) {
      throw new BadRequestException('Signature already captured');
    }

    const updatedPOD = await this.prisma.pODData.update({
      where: { id: podId },
      data: {
        signatureCaptured: true,
        signatoryName: dto.signatoryName,
        signatoryDesignation: dto.signatoryDesignation,
        signatureAttachmentId: dto.attachmentId,
      },
    });

    await this.auditService.log({
      eventType: 'POD',
      eventSubtype: 'SIGNATURE',
      action: 'UPDATE',
      actorId: addedById,
      entityType: 'pod',
      entityId: podId,
      entityRef: pod.order.orderNumber,
      summary: `Signature captured: ${pod.order.orderNumber} - ${dto.signatoryName}`,
    });

    return updatedPOD;
  }

  async addPhoto(podId: string, dto: AddPhotoDto, addedById: string) {
    const pod = await this.prisma.pODData.findUnique({
      where: { id: podId },
      include: { photos: true },
    });

    if (!pod) {
      throw new NotFoundException('POD not found');
    }

    const sequenceNumber = (pod.photos.length || 0) + 1;

    const photo = await this.prisma.pODPhoto.create({
      data: {
        podId,
        photoType: dto.photoType,
        attachmentId: dto.attachmentId,
        caption: dto.caption,
        sequenceNumber,
      },
    });

    return photo;
  }

  async createFailedDelivery(dto: FailedDeliveryDto, capturedById: string) {
    // Validate order
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { customer: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!['arrived', 'dispatched', 'in_transit'].includes(order.status)) {
      throw new BadRequestException(`Cannot record failed delivery for order in status: ${order.status}`);
    }

    // Check if POD already exists
    const existingPOD = await this.prisma.pODData.findFirst({
      where: { orderId: dto.orderId },
    });

    if (existingPOD) {
      throw new BadRequestException('POD already exists for this order');
    }

    // Create POD with failed outcome
    const pod = await this.prisma.pODData.create({
      data: {
        orderId: dto.orderId,
        routeStopId: dto.routeStopId,
        arrivalTime: new Date(),
        completionTime: new Date(),
        gpsLatitude: dto.gpsLatitude,
        gpsLongitude: dto.gpsLongitude,
        gpsAccuracyMeters: dto.gpsAccuracyMeters,
        signatureCaptured: false,
        outcome: dto.outcome,
        outcomeNotes: dto.reason,
        deviceId: dto.deviceId,
        appVersion: dto.appVersion,
        capturedBy: capturedById,
        photos: dto.photos
          ? {
              create: dto.photos.map((photo, index) => ({
                photoType: photo.photoType,
                attachmentId: photo.attachmentId,
                caption: photo.caption,
                sequenceNumber: index + 1,
              })),
            }
          : undefined,
      },
      include: {
        photos: true,
        order: true,
      },
    });

    // Update order status
    await this.prisma.order.update({
      where: { id: dto.orderId },
      data: {
        status: 'failed',
        exceptionType: dto.outcome,
        exceptionNotes: dto.reason,
      },
    });

    // Update route stop if provided
    if (dto.routeStopId) {
      await this.prisma.routeStop.update({
        where: { id: dto.routeStopId },
        data: {
          status: 'failed',
          actualArrival: pod.arrivalTime,
          actualDeparture: pod.completionTime,
          notes: dto.reason,
        },
      });

      // Still increment completed stops (attempted)
      const stop = await this.prisma.routeStop.findUnique({
        where: { id: dto.routeStopId },
      });
      if (stop) {
        await this.prisma.scheduleRun.update({
          where: { id: stop.runId },
          data: { completedStops: { increment: 1 } },
        });
      }
    }

    await this.auditService.log({
      eventType: 'POD',
      eventSubtype: 'FAILED',
      action: 'CREATE',
      actorId: capturedById,
      entityType: 'pod',
      entityId: pod.id,
      entityRef: order.orderNumber,
      summary: `Failed delivery: ${order.orderNumber} - ${dto.outcome}: ${dto.reason}`,
      newState: {
        orderId: dto.orderId,
        outcome: dto.outcome,
        reason: dto.reason,
      },
      gpsLatitude: dto.gpsLatitude,
      gpsLongitude: dto.gpsLongitude,
    });

    return pod;
  }

  // Get POD statistics
  async getStatistics(fromDate?: Date, toDate?: Date) {
    const where: any = {};
    if (fromDate || toDate) {
      where.completionTime = {};
      if (fromDate) where.completionTime.gte = fromDate;
      if (toDate) where.completionTime.lte = toDate;
    }

    const [
      total,
      delivered,
      partial,
      refused,
      noAccess,
      notHome,
      other,
      withSignature,
      withPhotos,
    ] = await Promise.all([
      this.prisma.pODData.count({ where }),
      this.prisma.pODData.count({ where: { ...where, outcome: 'delivered' } }),
      this.prisma.pODData.count({ where: { ...where, outcome: 'partial' } }),
      this.prisma.pODData.count({ where: { ...where, outcome: 'refused' } }),
      this.prisma.pODData.count({ where: { ...where, outcome: 'no_access' } }),
      this.prisma.pODData.count({ where: { ...where, outcome: 'not_home' } }),
      this.prisma.pODData.count({ where: { ...where, outcome: 'other' } }),
      this.prisma.pODData.count({ where: { ...where, signatureCaptured: true } }),
      this.prisma.pODData.count({
        where: { ...where, photos: { some: {} } },
      }),
    ]);

    const successRate = total > 0
      ? Math.round(((delivered + partial) / total) * 100)
      : 0;

    const signatureRate = total > 0
      ? Math.round((withSignature / total) * 100)
      : 0;

    return {
      total,
      byOutcome: {
        delivered,
        partial,
        refused,
        noAccess,
        notHome,
        other,
      },
      successRate,
      signatureCaptureRate: signatureRate,
      withPhotos,
    };
  }

  // Get driver's PODs for a date
  async getDriverPODs(driverId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.pODData.findMany({
      where: {
        completionTime: { gte: startOfDay, lte: endOfDay },
        routeStop: {
          run: { driverId },
        },
      },
      include: {
        order: {
          include: {
            customer: { select: { accountNumber: true, companyName: true } },
          },
        },
        photos: true,
      },
      orderBy: { completionTime: 'asc' },
    });
  }
}
