import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import {
  CreateCylinderMovementDto,
  AdjustmentDto,
  ApproveVarianceDto,
  MovementQueryDto,
  CreateRefillBatchDto,
  StartInspectionDto,
  CompleteInspectionDto,
  StartFillingDto,
  CompleteQCDto,
  RefillBatchQueryDto,
  CreateTankDto,
  UpdateTankDto,
  RecordTankReadingDto,
  CreateBulkMovementDto,
  CylinderSize,
  CylinderStatus,
} from './dto/inventory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Inventory - Cylinders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory/cylinders')
export class CylinderInventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('stock')
  @RequirePermissions({ resource: 'inventory', action: 'read' })
  @ApiOperation({ summary: 'Get cylinder stock summary' })
  async getStockSummary() {
    return this.inventoryService.getStockSummary();
  }

  @Get('stock/:size')
  @RequirePermissions({ resource: 'inventory', action: 'read' })
  @ApiParam({ name: 'size', enum: ['9kg', '14kg', '19kg', '48kg'] })
  @ApiOperation({ summary: 'Get stock for a specific cylinder size' })
  async getStockBySize(@Param('size') size: CylinderSize) {
    return this.inventoryService.getStockBySize(size);
  }

  @Get('stock/status/:status')
  @RequirePermissions({ resource: 'inventory', action: 'read' })
  @ApiParam({ name: 'status', enum: ['full', 'empty', 'quarantine', 'maintenance', 'issued', 'in_transit', 'at_customer'] })
  @ApiOperation({ summary: 'Get stock for a specific status' })
  async getStockByStatus(@Param('status') status: CylinderStatus) {
    return this.inventoryService.getStockByStatus(status);
  }

  @Get('movements')
  @RequirePermissions({ resource: 'inventory', action: 'read' })
  @ApiOperation({ summary: 'Get cylinder movements with filters' })
  async getMovements(@Query() query: MovementQueryDto) {
    return this.inventoryService.findAllMovements(query);
  }

  @Post('movements')
  @RequirePermissions({ resource: 'inventory', action: 'create' })
  @ApiOperation({ summary: 'Record a cylinder movement' })
  async createMovement(@Body() dto: CreateCylinderMovementDto, @Request() req: any) {
    return this.inventoryService.createMovement(dto, req.user.id);
  }

  @Post('adjustments')
  @RequirePermissions({ resource: 'inventory', action: 'update' })
  @ApiOperation({ summary: 'Create a stock adjustment' })
  async createAdjustment(@Body() dto: AdjustmentDto, @Request() req: any) {
    return this.inventoryService.createAdjustment(dto, req.user.id);
  }

  @Post('movements/:id/approve')
  @RequirePermissions({ resource: 'inventory', action: 'approve' })
  @ApiParam({ name: 'id', description: 'Movement ID' })
  @ApiOperation({ summary: 'Approve a variance/adjustment' })
  async approveVariance(
    @Param('id') id: string,
    @Body('notes') notes: string,
    @Request() req: any,
  ) {
    return this.inventoryService.approveVariance(id, req.user.id, notes);
  }

  @Get('alerts')
  @RequirePermissions({ resource: 'inventory', action: 'read' })
  @ApiOperation({ summary: 'Get low stock alerts' })
  async getLowStockAlerts() {
    return this.inventoryService.getLowStockAlerts();
  }
}

@ApiTags('Inventory - Refill Batches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory/refill-batches')
export class RefillBatchController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @RequirePermissions({ resource: 'inventory', action: 'read' })
  @ApiOperation({ summary: 'Get all refill batches' })
  async findAll(@Query() query: RefillBatchQueryDto) {
    return this.inventoryService.findAllRefillBatches(query);
  }

  @Get(':id')
  @RequirePermissions({ resource: 'inventory', action: 'read' })
  @ApiParam({ name: 'id', description: 'Batch ID' })
  @ApiOperation({ summary: 'Get refill batch by ID' })
  async findById(@Param('id') id: string) {
    return this.inventoryService.findRefillBatchById(id);
  }

  @Post()
  @RequirePermissions({ resource: 'inventory', action: 'create' })
  @ApiOperation({ summary: 'Create a new refill batch' })
  async create(@Body() dto: CreateRefillBatchDto, @Request() req: any) {
    return this.inventoryService.createRefillBatch(dto, req.user.id);
  }

  @Post(':id/start-inspection')
  @RequirePermissions({ resource: 'inventory', action: 'update' })
  @ApiParam({ name: 'id', description: 'Batch ID' })
  @ApiOperation({ summary: 'Start inspection of a batch' })
  async startInspection(
    @Param('id') id: string,
    @Body() dto: StartInspectionDto,
    @Request() req: any,
  ) {
    return this.inventoryService.startInspection(id, dto.preFillChecklistId, req.user.id);
  }

  @Post(':id/complete-inspection')
  @RequirePermissions({ resource: 'inventory', action: 'update' })
  @ApiParam({ name: 'id', description: 'Batch ID' })
  @ApiOperation({ summary: 'Complete inspection of a batch' })
  async completeInspection(
    @Param('id') id: string,
    @Body() dto: CompleteInspectionDto,
    @Request() req: any,
  ) {
    return this.inventoryService.completeInspection(id, dto, req.user.id);
  }

  @Post(':id/start-filling')
  @RequirePermissions({ resource: 'inventory', action: 'update' })
  @ApiParam({ name: 'id', description: 'Batch ID' })
  @ApiOperation({ summary: 'Start filling a batch' })
  async startFilling(
    @Param('id') id: string,
    @Body() dto: StartFillingDto,
    @Request() req: any,
  ) {
    return this.inventoryService.startFilling(id, dto.fillStationId, req.user.id);
  }

  @Post(':id/complete-filling')
  @RequirePermissions({ resource: 'inventory', action: 'update' })
  @ApiParam({ name: 'id', description: 'Batch ID' })
  @ApiOperation({ summary: 'Complete filling a batch' })
  async completeFilling(@Param('id') id: string, @Request() req: any) {
    return this.inventoryService.completeFilling(id, req.user.id);
  }

  @Post(':id/complete-qc')
  @RequirePermissions({ resource: 'inventory', action: 'update' })
  @ApiParam({ name: 'id', description: 'Batch ID' })
  @ApiOperation({ summary: 'Complete QC of a batch' })
  async completeQC(
    @Param('id') id: string,
    @Body() dto: CompleteQCDto,
    @Request() req: any,
  ) {
    return this.inventoryService.completeQC(id, dto, req.user.id);
  }

  @Post(':id/stock')
  @RequirePermissions({ resource: 'inventory', action: 'update' })
  @ApiParam({ name: 'id', description: 'Batch ID' })
  @ApiOperation({ summary: 'Stock a passed batch' })
  async stockBatch(@Param('id') id: string, @Request() req: any) {
    return this.inventoryService.stockBatch(id, req.user.id);
  }
}

@ApiTags('Inventory - Tanks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory/tanks')
export class TankInventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @RequirePermissions({ resource: 'inventory', action: 'read' })
  @ApiOperation({ summary: 'Get all tanks' })
  async findAll() {
    return this.inventoryService.findAllTanks();
  }

  @Get(':id')
  @RequirePermissions({ resource: 'inventory', action: 'read' })
  @ApiParam({ name: 'id', description: 'Tank ID' })
  @ApiOperation({ summary: 'Get tank by ID with readings and movements' })
  async findById(@Param('id') id: string) {
    return this.inventoryService.findTankById(id);
  }

  @Post()
  @RequirePermissions({ resource: 'inventory', action: 'create' })
  @ApiOperation({ summary: 'Create a new tank' })
  async create(@Body() dto: CreateTankDto, @Request() req: any) {
    return this.inventoryService.createTank(dto, req.user?.id);
  }

  @Put(':id')
  @RequirePermissions({ resource: 'inventory', action: 'update' })
  @ApiParam({ name: 'id', description: 'Tank ID' })
  @ApiOperation({ summary: 'Update a tank' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTankDto,
    @Request() req: any,
  ) {
    return this.inventoryService.updateTank(id, dto, req.user?.id);
  }

  @Post('readings')
  @RequirePermissions({ resource: 'inventory', action: 'create' })
  @ApiOperation({ summary: 'Record a tank reading' })
  async recordReading(@Body() dto: RecordTankReadingDto, @Request() req: any) {
    return this.inventoryService.recordTankReading(dto, req.user.id);
  }

  @Post('movements')
  @RequirePermissions({ resource: 'inventory', action: 'create' })
  @ApiOperation({ summary: 'Record a bulk movement' })
  async createMovement(@Body() dto: CreateBulkMovementDto, @Request() req: any) {
    return this.inventoryService.createBulkMovement(dto, req.user.id);
  }
}
