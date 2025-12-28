import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  CreateDriverDto,
  UpdateDriverDto,
  CreateScheduleRunDto,
  UpdateScheduleRunDto,
  AddStopDto,
  ReorderStopsDto,
  StartRunDto,
  CompleteRunDto,
  UpdateStopStatusDto,
} from './dto/schedule.dto';

// Run state machine
const RUN_STATUS_FLOW: Record<string, string[]> = {
  planned: ['ready', 'cancelled'],
  ready: ['in_progress', 'planned', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

@Injectable()
export class ScheduleService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private canTransitionRun(currentStatus: string, newStatus: string): boolean {
    const allowedTransitions = RUN_STATUS_FLOW[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  }

  // ============= VEHICLES =============

  async findAllVehicles(status?: string) {
    const where: any = {};
    if (status) where.status = status;

    return this.prisma.vehicle.findMany({
      where,
      orderBy: { registrationNumber: 'asc' },
    });
  }

  async findVehicleById(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        scheduleRuns: {
          take: 10,
          orderBy: { runDate: 'desc' },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return vehicle;
  }

  async createVehicle(dto: CreateVehicleDto, createdById?: string) {
    const existing = await this.prisma.vehicle.findUnique({
      where: { registrationNumber: dto.registrationNumber },
    });

    if (existing) {
      throw new ConflictException('Vehicle with this registration already exists');
    }

    const vehicle = await this.prisma.vehicle.create({
      data: {
        registrationNumber: dto.registrationNumber,
        vehicleType: dto.vehicleType as any,
        make: dto.make,
        model: dto.model,
        year: dto.year,
        bulkCapacityLitres: dto.bulkCapacityLitres,
        cylinderCapacityUnits: dto.cylinderCapacityUnits,
        licenseExpiry: dto.licenseExpiry ? new Date(dto.licenseExpiry) : null,
        roadworthyExpiry: dto.roadworthyExpiry ? new Date(dto.roadworthyExpiry) : null,
        insuranceExpiry: dto.insuranceExpiry ? new Date(dto.insuranceExpiry) : null,
        currentOdometer: dto.currentOdometer,
        status: 'available',
        notes: dto.notes,
      },
    });

    await this.auditService.log({
      eventType: 'VEHICLE',
      eventSubtype: 'CREATE',
      action: 'CREATE',
      actorId: createdById,
      entityType: 'vehicle',
      entityId: vehicle.id,
      entityRef: vehicle.registrationNumber,
      summary: `Vehicle created: ${vehicle.registrationNumber}`,
    });

    return vehicle;
  }

  async updateVehicle(id: string, dto: UpdateVehicleDto, updatedById?: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (dto.registrationNumber && dto.registrationNumber !== vehicle.registrationNumber) {
      const existing = await this.prisma.vehicle.findUnique({
        where: { registrationNumber: dto.registrationNumber },
      });
      if (existing) {
        throw new ConflictException('Vehicle with this registration already exists');
      }
    }

    const updatedVehicle = await this.prisma.vehicle.update({
      where: { id },
      data: {
        registrationNumber: dto.registrationNumber,
        vehicleType: dto.vehicleType ? (dto.vehicleType as any) : undefined,
        make: dto.make,
        model: dto.model,
        year: dto.year,
        bulkCapacityLitres: dto.bulkCapacityLitres,
        cylinderCapacityUnits: dto.cylinderCapacityUnits,
        currentOdometer: dto.currentOdometer,
        status: dto.status ? (dto.status as any) : undefined,
        notes: dto.notes,
        licenseExpiry: dto.licenseExpiry ? new Date(dto.licenseExpiry) : undefined,
        roadworthyExpiry: dto.roadworthyExpiry ? new Date(dto.roadworthyExpiry) : undefined,
        insuranceExpiry: dto.insuranceExpiry ? new Date(dto.insuranceExpiry) : undefined,
      },
    });

    await this.auditService.log({
      eventType: 'VEHICLE',
      eventSubtype: 'UPDATE',
      action: 'UPDATE',
      actorId: updatedById,
      entityType: 'vehicle',
      entityId: id,
      entityRef: updatedVehicle.registrationNumber,
      summary: `Vehicle updated: ${updatedVehicle.registrationNumber}`,
    });

    return updatedVehicle;
  }

  async getAvailableVehicles(date: Date, vehicleType?: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const where: any = {
      status: 'available',
    };

    if (vehicleType) {
      where.vehicleType = vehicleType;
    }

    // Get vehicles not assigned to any run on this date
    const busyVehicleIds = await this.prisma.scheduleRun.findMany({
      where: {
        runDate: { gte: startOfDay, lte: endOfDay },
        status: { in: ['planned', 'ready', 'in_progress'] },
        vehicleId: { not: null },
      },
      select: { vehicleId: true },
    });

    where.id = { notIn: busyVehicleIds.map((r) => r.vehicleId).filter(Boolean) as string[] };

    return this.prisma.vehicle.findMany({
      where,
      orderBy: { registrationNumber: 'asc' },
    });
  }

  // ============= DRIVERS =============

  async findAllDrivers(status?: string) {
    const where: any = {};
    if (status) where.status = status;

    return this.prisma.driver.findMany({
      where,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        preferredVehicle: true,
      },
      orderBy: { user: { lastName: 'asc' } },
    });
  }

  async findDriverById(id: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        preferredVehicle: true,
        scheduleRuns: {
          take: 10,
          orderBy: { runDate: 'desc' },
          include: { vehicle: true },
        },
      },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    return driver;
  }

  async createDriver(dto: CreateDriverDto, createdById?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingDriver = await this.prisma.driver.findUnique({
      where: { userId: dto.userId },
    });
    if (existingDriver) {
      throw new ConflictException('Driver profile already exists for this user');
    }

    const driver = await this.prisma.driver.create({
      data: {
        userId: dto.userId,
        employeeNumber: dto.employeeNumber,
        licenseNumber: dto.licenseNumber,
        licenseCode: dto.licenseCode,
        licenseExpiry: new Date(dto.licenseExpiry),
        pdpNumber: dto.pdpNumber,
        pdpExpiry: dto.pdpExpiry ? new Date(dto.pdpExpiry) : null,
        hazmatCertified: dto.hazmatCertified || false,
        hazmatCertExpiry: dto.hazmatCertExpiry ? new Date(dto.hazmatCertExpiry) : null,
        preferredVehicleId: dto.preferredVehicleId,
        status: 'active',
      },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    await this.auditService.log({
      eventType: 'DRIVER',
      eventSubtype: 'CREATE',
      action: 'CREATE',
      actorId: createdById,
      entityType: 'driver',
      entityId: driver.id,
      entityRef: `${driver.user.firstName} ${driver.user.lastName}`,
      summary: `Driver created: ${driver.user.firstName} ${driver.user.lastName}`,
    });

    return driver;
  }

  async updateDriver(id: string, dto: UpdateDriverDto, updatedById?: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const updatedDriver = await this.prisma.driver.update({
      where: { id },
      data: {
        employeeNumber: dto.employeeNumber,
        licenseNumber: dto.licenseNumber,
        licenseCode: dto.licenseCode,
        pdpNumber: dto.pdpNumber,
        hazmatCertified: dto.hazmatCertified,
        preferredVehicleId: dto.preferredVehicleId,
        status: dto.status ? (dto.status as any) : undefined,
        licenseExpiry: dto.licenseExpiry ? new Date(dto.licenseExpiry) : undefined,
        pdpExpiry: dto.pdpExpiry ? new Date(dto.pdpExpiry) : undefined,
        hazmatCertExpiry: dto.hazmatCertExpiry ? new Date(dto.hazmatCertExpiry) : undefined,
      },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    await this.auditService.log({
      eventType: 'DRIVER',
      eventSubtype: 'UPDATE',
      action: 'UPDATE',
      actorId: updatedById,
      entityType: 'driver',
      entityId: id,
      entityRef: `${driver.user.firstName} ${driver.user.lastName}`,
      summary: `Driver updated: ${driver.user.firstName} ${driver.user.lastName}`,
    });

    return updatedDriver;
  }

  async getAvailableDrivers(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get drivers not assigned to any run on this date
    const busyDriverIds = await this.prisma.scheduleRun.findMany({
      where: {
        runDate: { gte: startOfDay, lte: endOfDay },
        status: { in: ['planned', 'ready', 'in_progress'] },
        driverId: { not: null },
      },
      select: { driverId: true },
    });

    return this.prisma.driver.findMany({
      where: {
        status: 'active',
        id: { notIn: busyDriverIds.map((r) => r.driverId).filter(Boolean) as string[] },
        licenseExpiry: { gt: new Date() },
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        preferredVehicle: true,
      },
      orderBy: { user: { lastName: 'asc' } },
    });
  }

  // ============= SCHEDULE RUNS =============

  async findAllRuns(params: {
    date?: string;
    fromDate?: string;
    toDate?: string;
    status?: string;
    driverId?: string;
    vehicleId?: string;
    page?: number;
    limit?: number;
  }) {
    const { date, fromDate, toDate, status, driverId, vehicleId, page = 1, limit = 20 } = params;

    const where: any = {};

    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      where.runDate = { gte: startOfDay, lte: endOfDay };
    } else if (fromDate || toDate) {
      where.runDate = {};
      if (fromDate) where.runDate.gte = new Date(fromDate);
      if (toDate) where.runDate.lte = new Date(toDate);
    }

    if (status) where.status = status;
    if (driverId) where.driverId = driverId;
    if (vehicleId) where.vehicleId = vehicleId;

    const [data, total] = await Promise.all([
      this.prisma.scheduleRun.findMany({
        where,
        include: {
          driver: {
            include: {
              user: { select: { firstName: true, lastName: true, phone: true } },
            },
          },
          vehicle: true,
          stops: {
            include: {
              order: {
                include: {
                  customer: { select: { accountNumber: true, companyName: true } },
                  site: true,
                },
              },
            },
            orderBy: { sequenceNumber: 'asc' },
          },
        },
        orderBy: [{ runDate: 'asc' }, { plannedStartTime: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.scheduleRun.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findRunById(id: string) {
    const run = await this.prisma.scheduleRun.findUnique({
      where: { id },
      include: {
        driver: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
          },
        },
        vehicle: true,
        stops: {
          include: {
            order: {
              include: {
                customer: true,
                site: true,
                items: { include: { product: true } },
              },
            },
          },
          orderBy: { sequenceNumber: 'asc' },
        },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });

    if (!run) {
      throw new NotFoundException('Schedule run not found');
    }

    return run;
  }

  async createRun(dto: CreateScheduleRunDto, createdById?: string) {
    // Generate run number
    const runDate = new Date(dto.runDate);
    const dateStr = runDate.toISOString().slice(0, 10).replace(/-/g, '');
    const lastRun = await this.prisma.scheduleRun.findFirst({
      where: { runNumber: { startsWith: `RUN-${dateStr}` } },
      orderBy: { runNumber: 'desc' },
      select: { runNumber: true },
    });

    let nextNumber = 1;
    if (lastRun?.runNumber) {
      const match = lastRun.runNumber.match(/RUN-\d+-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    const runNumber = `RUN-${dateStr}-${nextNumber.toString().padStart(3, '0')}`;

    // Validate driver and vehicle if provided
    if (dto.driverId) {
      const driver = await this.prisma.driver.findUnique({ where: { id: dto.driverId } });
      if (!driver) throw new NotFoundException('Driver not found');
    }

    if (dto.vehicleId) {
      const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
      if (!vehicle) throw new NotFoundException('Vehicle not found');
    }

    const run = await this.prisma.scheduleRun.create({
      data: {
        runDate,
        runNumber,
        driverId: dto.driverId,
        vehicleId: dto.vehicleId,
        runType: dto.runType as any,
        status: 'planned',
        plannedStartTime: dto.plannedStartTime,
        totalStops: dto.stops?.length || 0,
        completedStops: 0,
        notes: dto.notes,
        createdById,
        stops: dto.stops
          ? {
              create: dto.stops.map((stop) => ({
                orderId: stop.orderId,
                sequenceNumber: stop.sequenceNumber,
                estimatedArrival: stop.estimatedArrival,
                estimatedDurationMinutes: stop.estimatedDurationMinutes || 30,
                status: 'pending',
              })),
            }
          : undefined,
      },
      include: {
        driver: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        vehicle: true,
        stops: {
          include: { order: true },
          orderBy: { sequenceNumber: 'asc' },
        },
      },
    });

    // Update orders to scheduled status
    if (dto.stops?.length) {
      await this.prisma.order.updateMany({
        where: { id: { in: dto.stops.map((s) => s.orderId) } },
        data: {
          status: 'scheduled',
          scheduledDate: runDate,
          scheduledRouteId: run.id,
        },
      });
    }

    await this.auditService.log({
      eventType: 'SCHEDULE',
      eventSubtype: 'RUN_CREATE',
      action: 'CREATE',
      actorId: createdById,
      entityType: 'schedule_run',
      entityId: run.id,
      entityRef: run.runNumber,
      summary: `Schedule run created: ${run.runNumber} with ${run.totalStops} stops`,
    });

    return run;
  }

  async updateRun(id: string, dto: UpdateScheduleRunDto, updatedById?: string) {
    const run = await this.prisma.scheduleRun.findUnique({ where: { id } });

    if (!run) {
      throw new NotFoundException('Schedule run not found');
    }

    if (!['planned', 'ready'].includes(run.status)) {
      throw new BadRequestException('Can only update runs in planned or ready status');
    }

    const updatedRun = await this.prisma.scheduleRun.update({
      where: { id },
      data: {
        runDate: dto.runDate ? new Date(dto.runDate) : undefined,
        driverId: dto.driverId,
        vehicleId: dto.vehicleId,
        runType: dto.runType ? (dto.runType as any) : undefined,
        plannedStartTime: dto.plannedStartTime,
        notes: dto.notes,
      },
      include: {
        driver: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        vehicle: true,
        stops: {
          include: { order: true },
          orderBy: { sequenceNumber: 'asc' },
        },
      },
    });

    await this.auditService.log({
      eventType: 'SCHEDULE',
      eventSubtype: 'RUN_UPDATE',
      action: 'UPDATE',
      actorId: updatedById,
      entityType: 'schedule_run',
      entityId: id,
      entityRef: run.runNumber,
      summary: `Schedule run updated: ${run.runNumber}`,
    });

    return updatedRun;
  }

  async addStop(runId: string, dto: AddStopDto, addedById?: string) {
    const run = await this.prisma.scheduleRun.findUnique({
      where: { id: runId },
      include: { stops: { orderBy: { sequenceNumber: 'desc' }, take: 1 } },
    });

    if (!run) {
      throw new NotFoundException('Schedule run not found');
    }

    if (!['planned', 'ready'].includes(run.status)) {
      throw new BadRequestException('Can only add stops to runs in planned or ready status');
    }

    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const sequenceNumber = dto.sequenceNumber || (run.stops[0]?.sequenceNumber || 0) + 1;

    const stop = await this.prisma.routeStop.create({
      data: {
        runId,
        orderId: dto.orderId,
        sequenceNumber,
        estimatedArrival: dto.estimatedArrival,
        estimatedDurationMinutes: dto.estimatedDurationMinutes || 30,
        status: 'pending',
      },
      include: { order: true },
    });

    // Update run stop count
    await this.prisma.scheduleRun.update({
      where: { id: runId },
      data: { totalStops: { increment: 1 } },
    });

    // Update order status
    await this.prisma.order.update({
      where: { id: dto.orderId },
      data: {
        status: 'scheduled',
        scheduledDate: run.runDate,
        scheduledRouteId: runId,
      },
    });

    await this.auditService.log({
      eventType: 'SCHEDULE',
      eventSubtype: 'STOP_ADD',
      action: 'CREATE',
      actorId: addedById,
      entityType: 'route_stop',
      entityId: stop.id,
      entityRef: `${run.runNumber}/${order.orderNumber}`,
      summary: `Stop added to run ${run.runNumber}: Order ${order.orderNumber}`,
    });

    return stop;
  }

  async removeStop(runId: string, stopId: string, removedById?: string) {
    const run = await this.prisma.scheduleRun.findUnique({ where: { id: runId } });
    if (!run) {
      throw new NotFoundException('Schedule run not found');
    }

    if (!['planned', 'ready'].includes(run.status)) {
      throw new BadRequestException('Can only remove stops from runs in planned or ready status');
    }

    const stop = await this.prisma.routeStop.findFirst({
      where: { id: stopId, runId },
      include: { order: true },
    });

    if (!stop) {
      throw new NotFoundException('Stop not found in this run');
    }

    await this.prisma.routeStop.delete({ where: { id: stopId } });

    // Update run stop count
    await this.prisma.scheduleRun.update({
      where: { id: runId },
      data: { totalStops: { decrement: 1 } },
    });

    // Reset order status
    await this.prisma.order.update({
      where: { id: stop.orderId },
      data: {
        status: 'created',
        scheduledDate: null,
        scheduledRouteId: null,
      },
    });

    await this.auditService.log({
      eventType: 'SCHEDULE',
      eventSubtype: 'STOP_REMOVE',
      action: 'DELETE',
      actorId: removedById,
      entityType: 'route_stop',
      entityId: stopId,
      entityRef: `${run.runNumber}/${stop.order.orderNumber}`,
      summary: `Stop removed from run ${run.runNumber}: Order ${stop.order.orderNumber}`,
    });

    return { message: 'Stop removed successfully' };
  }

  async reorderStops(runId: string, dto: ReorderStopsDto, reorderedById?: string) {
    const run = await this.prisma.scheduleRun.findUnique({ where: { id: runId } });
    if (!run) {
      throw new NotFoundException('Schedule run not found');
    }

    if (!['planned', 'ready'].includes(run.status)) {
      throw new BadRequestException('Can only reorder stops in planned or ready status');
    }

    // Update sequence numbers
    for (let i = 0; i < dto.stopIds.length; i++) {
      await this.prisma.routeStop.update({
        where: { id: dto.stopIds[i] },
        data: { sequenceNumber: i + 1 },
      });
    }

    await this.auditService.log({
      eventType: 'SCHEDULE',
      eventSubtype: 'STOPS_REORDER',
      action: 'UPDATE',
      actorId: reorderedById,
      entityType: 'schedule_run',
      entityId: runId,
      entityRef: run.runNumber,
      summary: `Stops reordered in run ${run.runNumber}`,
    });

    return this.findRunById(runId);
  }

  async markReady(id: string, markedById?: string) {
    const run = await this.prisma.scheduleRun.findUnique({
      where: { id },
      include: { stops: true },
    });

    if (!run) {
      throw new NotFoundException('Schedule run not found');
    }

    if (!this.canTransitionRun(run.status, 'ready')) {
      throw new BadRequestException(`Cannot mark run as ready from status: ${run.status}`);
    }

    if (!run.driverId || !run.vehicleId) {
      throw new BadRequestException('Run must have driver and vehicle assigned before marking ready');
    }

    if (run.stops.length === 0) {
      throw new BadRequestException('Run must have at least one stop before marking ready');
    }

    const updatedRun = await this.prisma.scheduleRun.update({
      where: { id },
      data: { status: 'ready' },
    });

    await this.auditService.log({
      eventType: 'SCHEDULE',
      eventSubtype: 'RUN_READY',
      action: 'UPDATE',
      actorId: markedById,
      entityType: 'schedule_run',
      entityId: id,
      entityRef: run.runNumber,
      summary: `Run marked ready: ${run.runNumber}`,
    });

    return updatedRun;
  }

  async startRun(id: string, dto: StartRunDto, startedById?: string) {
    const run = await this.prisma.scheduleRun.findUnique({ where: { id } });

    if (!run) {
      throw new NotFoundException('Schedule run not found');
    }

    if (!this.canTransitionRun(run.status, 'in_progress')) {
      throw new BadRequestException(`Cannot start run from status: ${run.status}`);
    }

    const updatedRun = await this.prisma.scheduleRun.update({
      where: { id },
      data: {
        status: 'in_progress',
        actualStartTime: new Date(),
      },
    });

    // Update vehicle odometer if provided
    if (dto.startOdometer && run.vehicleId) {
      await this.prisma.vehicle.update({
        where: { id: run.vehicleId },
        data: { currentOdometer: dto.startOdometer, status: 'in_use' },
      });
    }

    await this.auditService.log({
      eventType: 'SCHEDULE',
      eventSubtype: 'RUN_START',
      action: 'UPDATE',
      actorId: startedById,
      entityType: 'schedule_run',
      entityId: id,
      entityRef: run.runNumber,
      summary: `Run started: ${run.runNumber}`,
    });

    return updatedRun;
  }

  async completeRun(id: string, dto: CompleteRunDto, completedById?: string) {
    const run = await this.prisma.scheduleRun.findUnique({
      where: { id },
      include: { stops: true },
    });

    if (!run) {
      throw new NotFoundException('Schedule run not found');
    }

    if (!this.canTransitionRun(run.status, 'completed')) {
      throw new BadRequestException(`Cannot complete run from status: ${run.status}`);
    }

    const updatedRun = await this.prisma.scheduleRun.update({
      where: { id },
      data: {
        status: 'completed',
        actualEndTime: new Date(),
        notes: dto.notes ? `${run.notes || ''}\n${dto.notes}` : run.notes,
      },
    });

    // Update vehicle status and odometer
    if (run.vehicleId) {
      await this.prisma.vehicle.update({
        where: { id: run.vehicleId },
        data: {
          status: 'available',
          currentOdometer: dto.endOdometer || undefined,
        },
      });
    }

    await this.auditService.log({
      eventType: 'SCHEDULE',
      eventSubtype: 'RUN_COMPLETE',
      action: 'UPDATE',
      actorId: completedById,
      entityType: 'schedule_run',
      entityId: id,
      entityRef: run.runNumber,
      summary: `Run completed: ${run.runNumber} - ${run.completedStops}/${run.totalStops} stops`,
    });

    return updatedRun;
  }

  async cancelRun(id: string, reason: string, cancelledById?: string) {
    const run = await this.prisma.scheduleRun.findUnique({
      where: { id },
      include: { stops: { include: { order: true } } },
    });

    if (!run) {
      throw new NotFoundException('Schedule run not found');
    }

    if (!this.canTransitionRun(run.status, 'cancelled')) {
      throw new BadRequestException(`Cannot cancel run from status: ${run.status}`);
    }

    const updatedRun = await this.prisma.scheduleRun.update({
      where: { id },
      data: {
        status: 'cancelled',
        notes: `${run.notes || ''}\nCancelled: ${reason}`,
      },
    });

    // Reset orders back to created status
    const orderIds = run.stops.map((s) => s.orderId);
    if (orderIds.length > 0) {
      await this.prisma.order.updateMany({
        where: { id: { in: orderIds } },
        data: {
          status: 'created',
          scheduledDate: null,
          scheduledRouteId: null,
        },
      });
    }

    // Release vehicle
    if (run.vehicleId) {
      await this.prisma.vehicle.update({
        where: { id: run.vehicleId },
        data: { status: 'available' },
      });
    }

    await this.auditService.log({
      eventType: 'SCHEDULE',
      eventSubtype: 'RUN_CANCEL',
      action: 'UPDATE',
      actorId: cancelledById,
      entityType: 'schedule_run',
      entityId: id,
      entityRef: run.runNumber,
      summary: `Run cancelled: ${run.runNumber} - ${reason}`,
    });

    return updatedRun;
  }

  async updateStopStatus(runId: string, stopId: string, dto: UpdateStopStatusDto, updatedById?: string) {
    const stop = await this.prisma.routeStop.findFirst({
      where: { id: stopId, runId },
      include: { run: true, order: true },
    });

    if (!stop) {
      throw new NotFoundException('Stop not found in this run');
    }

    const updateData: any = { status: dto.status, notes: dto.notes };

    if (dto.status === 'arrived') {
      updateData.actualArrival = new Date();
    }

    if (dto.status === 'completed' || dto.status === 'skipped' || dto.status === 'failed') {
      updateData.actualDeparture = new Date();

      // Increment completed stops count
      await this.prisma.scheduleRun.update({
        where: { id: runId },
        data: { completedStops: { increment: 1 } },
      });
    }

    const updatedStop = await this.prisma.routeStop.update({
      where: { id: stopId },
      data: updateData,
      include: { order: true },
    });

    await this.auditService.log({
      eventType: 'SCHEDULE',
      eventSubtype: 'STOP_STATUS',
      action: 'UPDATE',
      actorId: updatedById,
      entityType: 'route_stop',
      entityId: stopId,
      entityRef: `${stop.run.runNumber}/${stop.order.orderNumber}`,
      summary: `Stop status updated: ${stop.order.orderNumber} → ${dto.status}`,
    });

    return updatedStop;
  }

  // Get today's schedule summary
  async getTodaySummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [runs, totalStops, completedStops, availableVehicles, availableDrivers] = await Promise.all([
      this.prisma.scheduleRun.count({
        where: { runDate: { gte: today, lt: tomorrow } },
      }),
      this.prisma.routeStop.count({
        where: { run: { runDate: { gte: today, lt: tomorrow } } },
      }),
      this.prisma.routeStop.count({
        where: {
          run: { runDate: { gte: today, lt: tomorrow } },
          status: 'completed',
        },
      }),
      this.getAvailableVehicles(today),
      this.getAvailableDrivers(today),
    ]);

    return {
      date: today.toISOString().slice(0, 10),
      runs,
      totalStops,
      completedStops,
      completionRate: totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0,
      availableVehicles: availableVehicles.length,
      availableDrivers: availableDrivers.length,
    };
  }
}
