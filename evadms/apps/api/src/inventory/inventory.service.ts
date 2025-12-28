import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateCylinderMovementDto,
  AdjustmentDto,
  CreateRefillBatchDto,
  CompleteInspectionDto,
  CompleteQCDto,
  CreateTankDto,
  UpdateTankDto,
  RecordTankReadingDto,
  CreateBulkMovementDto,
  CylinderSize,
  CylinderStatus,
  CylinderMovementType,
} from './dto/inventory.dto';

// Movement type to status transitions
const MOVEMENT_STATUS_MAP: Record<CylinderMovementType, { from?: CylinderStatus; to: CylinderStatus }> = {
  receive_empty: { to: 'empty' },
  refill: { from: 'empty', to: 'full' },
  issue: { from: 'full', to: 'issued' },
  deliver: { from: 'issued', to: 'at_customer' },
  collect_empty: { from: 'at_customer', to: 'empty' },
  return_full: { from: 'issued', to: 'full' },
  quarantine: { to: 'quarantine' },
  release_quarantine: { from: 'quarantine', to: 'empty' },
  maintenance: { to: 'maintenance' },
  release_maintenance: { from: 'maintenance', to: 'empty' },
  scrap: { from: 'maintenance', to: 'maintenance' }, // Special case - reduces count
  purchase: { to: 'full' },
  adjustment: { to: 'full' }, // Determined by context
  transfer_in: { to: 'full' },
  transfer_out: { from: 'full', to: 'full' }, // Special case - reduces count
};

// Refill batch state machine
const REFILL_STATUS_FLOW: Record<string, string[]> = {
  created: ['inspecting'],
  inspecting: ['filling', 'failed'],
  filling: ['qc'],
  qc: ['passed', 'failed'],
  passed: ['stocked'],
  failed: [],
  stocked: [],
};

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  // ============= CYLINDER STOCK =============

  async getStockSummary() {
    const stock = await this.prisma.cylinderStockSummary.findMany({
      orderBy: [{ cylinderSize: 'asc' }, { status: 'asc' }],
    });

    // Group by size
    const grouped: Record<string, Record<string, number>> = {};
    for (const item of stock) {
      if (!grouped[item.cylinderSize]) {
        grouped[item.cylinderSize] = {};
      }
      grouped[item.cylinderSize][item.status] = item.quantity;
    }

    return {
      bySize: grouped,
      totals: stock.reduce((acc, item) => {
        if (!acc[item.cylinderSize]) {
          acc[item.cylinderSize] = 0;
        }
        acc[item.cylinderSize] += item.quantity;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  async getStockBySize(cylinderSize: CylinderSize) {
    return this.prisma.cylinderStockSummary.findMany({
      where: { cylinderSize },
      orderBy: { status: 'asc' },
    });
  }

  async getStockByStatus(status: CylinderStatus) {
    return this.prisma.cylinderStockSummary.findMany({
      where: { status },
      orderBy: { cylinderSize: 'asc' },
    });
  }

  // ============= CYLINDER MOVEMENTS =============

  async findAllMovements(params: {
    page?: number;
    limit?: number;
    cylinderSize?: CylinderSize;
    movementType?: CylinderMovementType;
    fromDate?: string;
    toDate?: string;
    pendingApproval?: boolean;
  }) {
    const { page = 1, limit = 50, cylinderSize, movementType, fromDate, toDate, pendingApproval } = params;

    const where: any = {};

    if (cylinderSize) where.cylinderSize = cylinderSize;
    if (movementType) where.movementType = movementType;

    if (fromDate || toDate) {
      where.recordedAt = {};
      if (fromDate) where.recordedAt.gte = new Date(fromDate);
      if (toDate) where.recordedAt.lte = new Date(toDate);
    }

    if (pendingApproval !== undefined) {
      where.varianceApproved = pendingApproval ? null : { not: null };
    }

    const [movements, total] = await Promise.all([
      this.prisma.cylinderMovement.findMany({
        where,
        include: {
          order: { select: { orderNumber: true } },
          refillBatch: { select: { batchRef: true } },
          recordedBy: { select: { firstName: true, lastName: true } },
          varianceApprovedBy: { select: { firstName: true, lastName: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { recordedAt: 'desc' },
      }),
      this.prisma.cylinderMovement.count({ where }),
    ]);

    return {
      data: movements,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createMovement(dto: CreateCylinderMovementDto, recordedById: string) {
    // Generate movement reference
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const lastMovement = await this.prisma.cylinderMovement.findFirst({
      where: { movementRef: { startsWith: `MOV-${dateStr}` } },
      orderBy: { movementRef: 'desc' },
      select: { movementRef: true },
    });

    let nextNumber = 1;
    if (lastMovement?.movementRef) {
      const match = lastMovement.movementRef.match(/MOV-\d+-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    const movementRef = `MOV-${dateStr}-${nextNumber.toString().padStart(4, '0')}`;

    const statusMapping = MOVEMENT_STATUS_MAP[dto.movementType];

    // Create movement record
    const movement = await this.prisma.cylinderMovement.create({
      data: {
        movementRef,
        cylinderSize: dto.cylinderSize as any,
        movementType: dto.movementType as any,
        fromStatus: statusMapping.from as any,
        toStatus: statusMapping.to as any,
        quantity: dto.quantity,
        orderId: dto.orderId,
        refillBatchId: dto.refillBatchId,
        routeStopId: dto.routeStopId,
        reason: dto.reason,
        notes: dto.notes,
        recordedAt: new Date(),
        recordedById: recordedById,
      },
    });

    // Update stock summary
    await this.updateStockFromMovement(
      dto.cylinderSize,
      dto.movementType,
      dto.quantity,
      statusMapping.from,
      statusMapping.to,
    );

    await this.auditService.log({
      eventType: 'INVENTORY',
      eventSubtype: 'MOVEMENT',
      action: 'CREATE',
      actorId: recordedById,
      entityType: 'cylinder_movement',
      entityId: movement.id,
      entityRef: movement.movementRef,
      summary: `Cylinder movement: ${dto.quantity}x ${dto.cylinderSize} - ${dto.movementType}`,
      newState: {
        cylinderSize: dto.cylinderSize,
        movementType: dto.movementType,
        quantity: dto.quantity,
      },
    });

    return movement;
  }

  async createAdjustment(dto: AdjustmentDto, adjustedById: string) {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const lastMovement = await this.prisma.cylinderMovement.findFirst({
      where: { movementRef: { startsWith: `ADJ-${dateStr}` } },
      orderBy: { movementRef: 'desc' },
      select: { movementRef: true },
    });

    let nextNumber = 1;
    if (lastMovement?.movementRef) {
      const match = lastMovement.movementRef.match(/ADJ-\d+-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    const movementRef = `ADJ-${dateStr}-${nextNumber.toString().padStart(4, '0')}`;

    const movement = await this.prisma.cylinderMovement.create({
      data: {
        movementRef,
        cylinderSize: dto.cylinderSize as any,
        movementType: 'adjustment' as any,
        toStatus: dto.status as any,
        quantity: Math.abs(dto.adjustment),
        reason: dto.reason,
        notes: dto.notes,
        varianceApproved: null, // Needs approval
        recordedAt: new Date(),
        recordedById: adjustedById,
      },
    });

    // Update stock directly
    await this.prisma.cylinderStockSummary.upsert({
      where: {
        cylinderSize_status: {
          cylinderSize: dto.cylinderSize as any,
          status: dto.status as any,
        },
      },
      update: {
        quantity: { increment: dto.adjustment },
        lastUpdated: new Date(),
      },
      create: {
        cylinderSize: dto.cylinderSize as any,
        status: dto.status as any,
        quantity: dto.adjustment > 0 ? dto.adjustment : 0,
        lastUpdated: new Date(),
      },
    });

    await this.auditService.log({
      eventType: 'INVENTORY',
      eventSubtype: 'ADJUSTMENT',
      action: 'CREATE',
      actorId: adjustedById,
      entityType: 'cylinder_movement',
      entityId: movement.id,
      entityRef: movement.movementRef,
      summary: `Stock adjustment: ${dto.adjustment > 0 ? '+' : ''}${dto.adjustment}x ${dto.cylinderSize} (${dto.status}) - ${dto.reason}`,
      newState: {
        cylinderSize: dto.cylinderSize,
        status: dto.status,
        adjustment: dto.adjustment,
        reason: dto.reason,
      },
    });

    return movement;
  }

  async approveVariance(movementId: string, approvedById: string, notes?: string) {
    const movement = await this.prisma.cylinderMovement.findUnique({
      where: { id: movementId },
    });

    if (!movement) {
      throw new NotFoundException('Movement not found');
    }

    if (movement.varianceApproved !== null) {
      throw new BadRequestException('Variance already processed');
    }

    const updatedMovement = await this.prisma.cylinderMovement.update({
      where: { id: movementId },
      data: {
        varianceApproved: true,
        varianceApprovedById: approvedById,
        varianceApprovedAt: new Date(),
        notes: notes ? `${movement.notes || ''}\nApproval: ${notes}` : movement.notes,
      },
    });

    await this.auditService.log({
      eventType: 'INVENTORY',
      eventSubtype: 'VARIANCE_APPROVE',
      action: 'UPDATE',
      actorId: approvedById,
      entityType: 'cylinder_movement',
      entityId: movementId,
      entityRef: movement.movementRef,
      summary: `Variance approved: ${movement.movementRef}`,
    });

    return updatedMovement;
  }

  private async updateStockFromMovement(
    cylinderSize: CylinderSize,
    movementType: CylinderMovementType,
    quantity: number,
    fromStatus?: CylinderStatus,
    toStatus?: CylinderStatus,
  ) {
    // Decrease from status
    if (fromStatus) {
      await this.prisma.cylinderStockSummary.upsert({
        where: {
          cylinderSize_status: { cylinderSize: cylinderSize as any, status: fromStatus as any },
        },
        update: {
          quantity: { decrement: quantity },
          lastUpdated: new Date(),
        },
        create: {
          cylinderSize: cylinderSize as any,
          status: fromStatus as any,
          quantity: 0,
          lastUpdated: new Date(),
        },
      });
    }

    // Increase to status (except for scrap/transfer_out which remove stock)
    if (toStatus && !['scrap', 'transfer_out'].includes(movementType)) {
      await this.prisma.cylinderStockSummary.upsert({
        where: {
          cylinderSize_status: { cylinderSize: cylinderSize as any, status: toStatus as any },
        },
        update: {
          quantity: { increment: quantity },
          lastUpdated: new Date(),
        },
        create: {
          cylinderSize: cylinderSize as any,
          status: toStatus as any,
          quantity: quantity,
          lastUpdated: new Date(),
        },
      });
    }
  }

  // ============= REFILL BATCHES =============

  async findAllRefillBatches(params: {
    page?: number;
    limit?: number;
    cylinderSize?: CylinderSize;
    status?: string;
    fromDate?: string;
    toDate?: string;
  }) {
    const { page = 1, limit = 20, cylinderSize, status, fromDate, toDate } = params;

    const where: any = {};

    if (cylinderSize) where.cylinderSize = cylinderSize;
    if (status) where.status = status;

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }

    const [batches, total] = await Promise.all([
      this.prisma.cylinderRefillBatch.findMany({
        where,
        include: {
          createdBy: { select: { firstName: true, lastName: true } },
          inspectedBy: { select: { firstName: true, lastName: true } },
          filledBy: { select: { firstName: true, lastName: true } },
          qcBy: { select: { firstName: true, lastName: true } },
          stockedBy: { select: { firstName: true, lastName: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.cylinderRefillBatch.count({ where }),
    ]);

    return {
      data: batches,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findRefillBatchById(id: string) {
    const batch = await this.prisma.cylinderRefillBatch.findUnique({
      where: { id },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        inspectedBy: { select: { firstName: true, lastName: true } },
        filledBy: { select: { firstName: true, lastName: true } },
        qcBy: { select: { firstName: true, lastName: true } },
        stockedBy: { select: { firstName: true, lastName: true } },
        movements: true,
      },
    });

    if (!batch) {
      throw new NotFoundException('Refill batch not found');
    }

    return batch;
  }

  async createRefillBatch(dto: CreateRefillBatchDto, createdById: string) {
    // Check if there are enough empty cylinders
    const emptyStock = await this.prisma.cylinderStockSummary.findUnique({
      where: {
        cylinderSize_status: { cylinderSize: dto.cylinderSize as any, status: 'empty' },
      },
    });

    if (!emptyStock || emptyStock.quantity < dto.quantity) {
      throw new BadRequestException(
        `Insufficient empty ${dto.cylinderSize} cylinders. Available: ${emptyStock?.quantity || 0}`,
      );
    }

    // Generate batch reference
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const lastBatch = await this.prisma.cylinderRefillBatch.findFirst({
      where: { batchRef: { startsWith: `FILL-${dateStr}` } },
      orderBy: { batchRef: 'desc' },
      select: { batchRef: true },
    });

    let nextNumber = 1;
    if (lastBatch?.batchRef) {
      const match = lastBatch.batchRef.match(/FILL-\d+-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    const batchRef = `FILL-${dateStr}-${nextNumber.toString().padStart(3, '0')}`;

    const batch = await this.prisma.cylinderRefillBatch.create({
      data: {
        batchRef,
        cylinderSize: dto.cylinderSize as any,
        quantity: dto.quantity,
        status: 'created',
        passedCount: 0,
        failedCount: 0,
        notes: dto.notes,
        createdById,
      },
    });

    await this.auditService.log({
      eventType: 'INVENTORY',
      eventSubtype: 'REFILL_BATCH_CREATE',
      action: 'CREATE',
      actorId: createdById,
      entityType: 'refill_batch',
      entityId: batch.id,
      entityRef: batch.batchRef,
      summary: `Refill batch created: ${batch.batchRef} - ${dto.quantity}x ${dto.cylinderSize}`,
    });

    return batch;
  }

  async startInspection(id: string, checklistId: string | undefined, inspectedById: string) {
    const batch = await this.prisma.cylinderRefillBatch.findUnique({ where: { id } });

    if (!batch) throw new NotFoundException('Refill batch not found');
    if (batch.status !== 'created') {
      throw new BadRequestException('Batch must be in created status to start inspection');
    }

    const updatedBatch = await this.prisma.cylinderRefillBatch.update({
      where: { id },
      data: {
        status: 'inspecting',
        preFillChecklistId: checklistId,
        inspectedAt: new Date(),
        inspectedById: inspectedById,
      },
    });

    // Create movement to reserve empty cylinders
    await this.createMovement(
      {
        cylinderSize: batch.cylinderSize as CylinderSize,
        movementType: 'refill',
        quantity: batch.quantity,
        refillBatchId: id,
        reason: `Refill batch ${batch.batchRef} - inspection started`,
      },
      inspectedById,
    );

    await this.auditService.log({
      eventType: 'INVENTORY',
      eventSubtype: 'REFILL_INSPECTION_START',
      action: 'UPDATE',
      actorId: inspectedById,
      entityType: 'refill_batch',
      entityId: id,
      entityRef: batch.batchRef,
      summary: `Refill batch inspection started: ${batch.batchRef}`,
    });

    return updatedBatch;
  }

  async completeInspection(id: string, dto: CompleteInspectionDto, completedById: string) {
    const batch = await this.prisma.cylinderRefillBatch.findUnique({ where: { id } });

    if (!batch) throw new NotFoundException('Refill batch not found');
    if (batch.status !== 'inspecting') {
      throw new BadRequestException('Batch must be in inspecting status');
    }

    if (dto.passedCount + dto.failedCount !== batch.quantity) {
      throw new BadRequestException(
        `Total (${dto.passedCount + dto.failedCount}) must equal batch quantity (${batch.quantity})`,
      );
    }

    const newStatus = dto.passedCount > 0 ? 'filling' : 'failed';

    const updatedBatch = await this.prisma.cylinderRefillBatch.update({
      where: { id },
      data: {
        status: newStatus as any,
        passedCount: dto.passedCount,
        failedCount: dto.failedCount,
        quantity: dto.passedCount, // Update to passed count
        notes: dto.notes ? `${batch.notes || ''}\nInspection: ${dto.notes}` : batch.notes,
      },
    });

    // If any failed, move to quarantine
    if (dto.failedCount > 0) {
      await this.createMovement(
        {
          cylinderSize: batch.cylinderSize as CylinderSize,
          movementType: 'quarantine',
          quantity: dto.failedCount,
          refillBatchId: id,
          reason: `Failed inspection in batch ${batch.batchRef}`,
        },
        completedById,
      );
    }

    await this.auditService.log({
      eventType: 'INVENTORY',
      eventSubtype: 'REFILL_INSPECTION_COMPLETE',
      action: 'UPDATE',
      actorId: completedById,
      entityType: 'refill_batch',
      entityId: id,
      entityRef: batch.batchRef,
      summary: `Refill batch inspection complete: ${batch.batchRef} - ${dto.passedCount} passed, ${dto.failedCount} failed`,
    });

    return updatedBatch;
  }

  async startFilling(id: string, fillStationId: string | undefined, filledById: string) {
    const batch = await this.prisma.cylinderRefillBatch.findUnique({ where: { id } });

    if (!batch) throw new NotFoundException('Refill batch not found');
    if (batch.status !== 'filling') {
      throw new BadRequestException('Batch must be in filling status');
    }

    const updatedBatch = await this.prisma.cylinderRefillBatch.update({
      where: { id },
      data: {
        fillStationId,
        fillStartedAt: new Date(),
        filledById: filledById,
      },
    });

    await this.auditService.log({
      eventType: 'INVENTORY',
      eventSubtype: 'REFILL_FILLING_START',
      action: 'UPDATE',
      actorId: filledById,
      entityType: 'refill_batch',
      entityId: id,
      entityRef: batch.batchRef,
      summary: `Refill batch filling started: ${batch.batchRef}`,
    });

    return updatedBatch;
  }

  async completeFilling(id: string, completedById: string) {
    const batch = await this.prisma.cylinderRefillBatch.findUnique({ where: { id } });

    if (!batch) throw new NotFoundException('Refill batch not found');
    if (batch.status !== 'filling') {
      throw new BadRequestException('Batch must be in filling status');
    }

    const updatedBatch = await this.prisma.cylinderRefillBatch.update({
      where: { id },
      data: {
        status: 'qc',
        fillCompletedAt: new Date(),
      },
    });

    await this.auditService.log({
      eventType: 'INVENTORY',
      eventSubtype: 'REFILL_FILLING_COMPLETE',
      action: 'UPDATE',
      actorId: completedById,
      entityType: 'refill_batch',
      entityId: id,
      entityRef: batch.batchRef,
      summary: `Refill batch filling complete: ${batch.batchRef}`,
    });

    return updatedBatch;
  }

  async completeQC(id: string, dto: CompleteQCDto, qcById: string) {
    const batch = await this.prisma.cylinderRefillBatch.findUnique({ where: { id } });

    if (!batch) throw new NotFoundException('Refill batch not found');
    if (batch.status !== 'qc') {
      throw new BadRequestException('Batch must be in QC status');
    }

    if (dto.passedCount + dto.failedCount !== batch.quantity) {
      throw new BadRequestException(
        `Total (${dto.passedCount + dto.failedCount}) must equal batch quantity (${batch.quantity})`,
      );
    }

    const newStatus = dto.passedCount > 0 ? 'passed' : 'failed';

    const updatedBatch = await this.prisma.cylinderRefillBatch.update({
      where: { id },
      data: {
        status: newStatus as any,
        qcChecklistId: dto.qcChecklistId,
        qcAt: new Date(),
        qcById: qcById,
        passedCount: dto.passedCount,
        failedCount: (batch.failedCount || 0) + dto.failedCount,
        quantity: dto.passedCount,
      },
    });

    // If any failed QC, move to quarantine
    if (dto.failedCount > 0) {
      await this.createMovement(
        {
          cylinderSize: batch.cylinderSize as CylinderSize,
          movementType: 'quarantine',
          quantity: dto.failedCount,
          refillBatchId: id,
          reason: `Failed QC in batch ${batch.batchRef}`,
        },
        qcById,
      );
    }

    await this.auditService.log({
      eventType: 'INVENTORY',
      eventSubtype: 'REFILL_QC_COMPLETE',
      action: 'UPDATE',
      actorId: qcById,
      entityType: 'refill_batch',
      entityId: id,
      entityRef: batch.batchRef,
      summary: `Refill batch QC complete: ${batch.batchRef} - ${dto.passedCount} passed, ${dto.failedCount} failed`,
    });

    return updatedBatch;
  }

  async stockBatch(id: string, stockedById: string) {
    const batch = await this.prisma.cylinderRefillBatch.findUnique({ where: { id } });

    if (!batch) throw new NotFoundException('Refill batch not found');
    if (batch.status !== 'passed') {
      throw new BadRequestException('Batch must be in passed status to stock');
    }

    // Create stock movement
    const movement = await this.createMovement(
      {
        cylinderSize: batch.cylinderSize as CylinderSize,
        movementType: 'refill',
        quantity: batch.passedCount,
        refillBatchId: id,
        reason: `Batch ${batch.batchRef} stocked`,
      },
      stockedById,
    );

    const updatedBatch = await this.prisma.cylinderRefillBatch.update({
      where: { id },
      data: {
        status: 'stocked',
        stockedAt: new Date(),
        stockedById: stockedById,
        stockMovementId: movement.id,
      },
    });

    await this.auditService.log({
      eventType: 'INVENTORY',
      eventSubtype: 'REFILL_STOCKED',
      action: 'UPDATE',
      actorId: stockedById,
      entityType: 'refill_batch',
      entityId: id,
      entityRef: batch.batchRef,
      summary: `Refill batch stocked: ${batch.batchRef} - ${batch.passedCount}x ${batch.cylinderSize}`,
    });

    return updatedBatch;
  }

  // ============= TANKS (BULK STORAGE) =============

  async findAllTanks() {
    return this.prisma.tank.findMany({
      include: {
        readings: {
          take: 1,
          orderBy: { readingTime: 'desc' },
        },
      },
      orderBy: { tankCode: 'asc' },
    });
  }

  async findTankById(id: string) {
    const tank = await this.prisma.tank.findUnique({
      where: { id },
      include: {
        readings: {
          take: 24,
          orderBy: { readingTime: 'desc' },
        },
        movements: {
          take: 20,
          orderBy: { recordedAt: 'desc' },
        },
      },
    });

    if (!tank) {
      throw new NotFoundException('Tank not found');
    }

    return tank;
  }

  async createTank(dto: CreateTankDto, createdById?: string) {
    const existing = await this.prisma.tank.findUnique({
      where: { tankCode: dto.tankCode },
    });

    if (existing) {
      throw new ConflictException('Tank with this code already exists');
    }

    const tank = await this.prisma.tank.create({
      data: {
        tankCode: dto.tankCode,
        name: dto.name,
        capacityLitres: dto.capacityLitres,
        currentLevelLitres: 0,
        minLevelLitres: dto.minimumLevelLitres,
        reorderLevelLitres: dto.maximumLevelLitres || dto.capacityLitres,
        status: 'active',
      },
    });

    await this.auditService.log({
      eventType: 'INVENTORY',
      eventSubtype: 'TANK_CREATE',
      action: 'CREATE',
      actorId: createdById,
      entityType: 'tank',
      entityId: tank.id,
      entityRef: tank.tankCode,
      summary: `Tank created: ${tank.tankCode}`,
    });

    return tank;
  }

  async updateTank(id: string, dto: UpdateTankDto, updatedById?: string) {
    const tank = await this.prisma.tank.findUnique({ where: { id } });

    if (!tank) {
      throw new NotFoundException('Tank not found');
    }

    const updatedTank = await this.prisma.tank.update({
      where: { id },
      data: dto as any,
    });

    await this.auditService.log({
      eventType: 'INVENTORY',
      eventSubtype: 'TANK_UPDATE',
      action: 'UPDATE',
      actorId: updatedById,
      entityType: 'tank',
      entityId: id,
      entityRef: tank.tankCode,
      summary: `Tank updated: ${tank.tankCode}`,
    });

    return updatedTank;
  }

  async recordTankReading(dto: RecordTankReadingDto, recordedById: string) {
    const tank = await this.prisma.tank.findUnique({ where: { id: dto.tankId } });

    if (!tank) {
      throw new NotFoundException('Tank not found');
    }

    const reading = await this.prisma.tankReading.create({
      data: {
        tankId: dto.tankId,
        levelLitres: dto.levelLitres,
        temperatureCelsius: dto.temperatureCelsius,
        readingType: 'spot_check' as any,
        readingTime: new Date(),
        notes: dto.notes,
        recordedById: recordedById,
      },
    });

    // Update tank current level
    await this.prisma.tank.update({
      where: { id: dto.tankId },
      data: {
        currentLevelLitres: dto.levelLitres,
        lastReadingAt: new Date(),
      },
    });

    return reading;
  }

  async createBulkMovement(dto: CreateBulkMovementDto, recordedById: string) {
    const tank = await this.prisma.tank.findUnique({ where: { id: dto.tankId } });

    if (!tank) {
      throw new NotFoundException('Tank not found');
    }

    // Generate movement reference
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const lastMovement = await this.prisma.bulkMovement.findFirst({
      where: { movementRef: { startsWith: `BULK-${dateStr}` } },
      orderBy: { movementRef: 'desc' },
      select: { movementRef: true },
    });

    let nextNumber = 1;
    if (lastMovement?.movementRef) {
      const match = lastMovement.movementRef.match(/BULK-\d+-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    const movementRef = `BULK-${dateStr}-${nextNumber.toString().padStart(4, '0')}`;

    // Calculate new level
    let levelChange = dto.quantityLitres;
    if (['dispense', 'transfer_out', 'loss'].includes(dto.movementType)) {
      levelChange = -dto.quantityLitres;
    }

    const currentLevel = Number(tank.currentLevelLitres);
    const newLevel = currentLevel + levelChange;

    if (newLevel < 0) {
      throw new BadRequestException('Insufficient tank level for this movement');
    }

    if (newLevel > Number(tank.capacityLitres)) {
      throw new BadRequestException('Movement would exceed tank capacity');
    }

    const movement = await this.prisma.bulkMovement.create({
      data: {
        movementRef,
        tankId: dto.tankId,
        movementType: dto.movementType as any,
        quantityLitres: dto.quantityLitres,
        reason: dto.reason,
        notes: dto.notes,
        recordedAt: new Date(),
        recordedById: recordedById,
      },
    });

    // Update tank level
    await this.prisma.tank.update({
      where: { id: dto.tankId },
      data: { currentLevelLitres: newLevel },
    });

    await this.auditService.log({
      eventType: 'INVENTORY',
      eventSubtype: 'BULK_MOVEMENT',
      action: 'CREATE',
      actorId: recordedById,
      entityType: 'bulk_movement',
      entityId: movement.id,
      entityRef: movement.movementRef,
      summary: `Bulk movement: ${dto.movementType} ${dto.quantityLitres}L from ${tank.tankCode}`,
      newState: {
        tank: tank.tankCode,
        movementType: dto.movementType,
        quantity: dto.quantityLitres,
        levelBefore: currentLevel,
        levelAfter: newLevel,
      },
    });

    return movement;
  }

  // Get low stock alerts
  async getLowStockAlerts() {
    const [cylinders, tanks] = await Promise.all([
      // Cylinders below threshold
      this.prisma.cylinderStockSummary.findMany({
        where: {
          status: 'full',
          quantity: { lt: 10 }, // Configurable threshold
        },
      }),
      // Tanks below minimum - use raw query since field comparison is complex
      this.prisma.$queryRaw`SELECT * FROM tanks WHERE status = 'active' AND current_level_litres < min_level_litres` as Promise<any[]>,
    ]);

    return {
      cylinders: cylinders.map((c) => ({
        type: 'cylinder',
        size: c.cylinderSize,
        current: c.quantity,
        threshold: 10,
      })),
      tanks: tanks.map((t: any) => ({
        type: 'tank',
        code: t.tank_code,
        current: t.current_level_litres,
        minimum: t.min_level_litres,
        capacity: t.capacity_litres,
      })),
    };
  }
}
