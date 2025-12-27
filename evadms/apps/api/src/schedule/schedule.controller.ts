import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
import { ScheduleService } from './schedule.service';
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
  ScheduleQueryDto,
} from './dto/schedule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

// ============= VEHICLES CONTROLLER =============
@ApiTags('Vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  @RequirePermissions({ resource: 'schedule', action: 'read' })
  @ApiOperation({ summary: 'Get all vehicles' })
  async findAll(@Query('status') status?: string) {
    return this.scheduleService.findAllVehicles(status);
  }

  @Get('available')
  @RequirePermissions({ resource: 'schedule', action: 'read' })
  @ApiOperation({ summary: 'Get available vehicles for a date' })
  async getAvailable(
    @Query('date') date: string,
    @Query('type') type?: string,
  ) {
    return this.scheduleService.getAvailableVehicles(new Date(date), type);
  }

  @Get(':id')
  @RequirePermissions({ resource: 'schedule', action: 'read' })
  @ApiParam({ name: 'id', description: 'Vehicle ID' })
  @ApiOperation({ summary: 'Get vehicle by ID' })
  async findById(@Param('id') id: string) {
    return this.scheduleService.findVehicleById(id);
  }

  @Post()
  @RequirePermissions({ resource: 'schedule', action: 'create' })
  @ApiOperation({ summary: 'Create a new vehicle' })
  async create(@Body() dto: CreateVehicleDto, @Request() req: any) {
    return this.scheduleService.createVehicle(dto, req.user?.id);
  }

  @Put(':id')
  @RequirePermissions({ resource: 'schedule', action: 'update' })
  @ApiParam({ name: 'id', description: 'Vehicle ID' })
  @ApiOperation({ summary: 'Update a vehicle' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
    @Request() req: any,
  ) {
    return this.scheduleService.updateVehicle(id, dto, req.user?.id);
  }
}

// ============= DRIVERS CONTROLLER =============
@ApiTags('Drivers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('drivers')
export class DriversController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  @RequirePermissions({ resource: 'schedule', action: 'read' })
  @ApiOperation({ summary: 'Get all drivers' })
  async findAll(@Query('status') status?: string) {
    return this.scheduleService.findAllDrivers(status);
  }

  @Get('available')
  @RequirePermissions({ resource: 'schedule', action: 'read' })
  @ApiOperation({ summary: 'Get available drivers for a date' })
  async getAvailable(@Query('date') date: string) {
    return this.scheduleService.getAvailableDrivers(new Date(date));
  }

  @Get(':id')
  @RequirePermissions({ resource: 'schedule', action: 'read' })
  @ApiParam({ name: 'id', description: 'Driver ID' })
  @ApiOperation({ summary: 'Get driver by ID' })
  async findById(@Param('id') id: string) {
    return this.scheduleService.findDriverById(id);
  }

  @Post()
  @RequirePermissions({ resource: 'schedule', action: 'create' })
  @ApiOperation({ summary: 'Create a new driver' })
  async create(@Body() dto: CreateDriverDto, @Request() req: any) {
    return this.scheduleService.createDriver(dto, req.user?.id);
  }

  @Put(':id')
  @RequirePermissions({ resource: 'schedule', action: 'update' })
  @ApiParam({ name: 'id', description: 'Driver ID' })
  @ApiOperation({ summary: 'Update a driver' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDriverDto,
    @Request() req: any,
  ) {
    return this.scheduleService.updateDriver(id, dto, req.user?.id);
  }
}

// ============= SCHEDULE RUNS CONTROLLER =============
@ApiTags('Schedule')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get('summary/today')
  @RequirePermissions({ resource: 'schedule', action: 'read' })
  @ApiOperation({ summary: 'Get today\'s schedule summary' })
  async getTodaySummary() {
    return this.scheduleService.getTodaySummary();
  }

  @Get('runs')
  @RequirePermissions({ resource: 'schedule', action: 'read' })
  @ApiOperation({ summary: 'Get all schedule runs' })
  async findAllRuns(@Query() query: ScheduleQueryDto) {
    return this.scheduleService.findAllRuns(query);
  }

  @Get('runs/:id')
  @RequirePermissions({ resource: 'schedule', action: 'read' })
  @ApiParam({ name: 'id', description: 'Run ID' })
  @ApiOperation({ summary: 'Get schedule run by ID' })
  async findRunById(@Param('id') id: string) {
    return this.scheduleService.findRunById(id);
  }

  @Post('runs')
  @RequirePermissions({ resource: 'schedule', action: 'create' })
  @ApiOperation({ summary: 'Create a new schedule run' })
  async createRun(@Body() dto: CreateScheduleRunDto, @Request() req: any) {
    return this.scheduleService.createRun(dto, req.user?.id);
  }

  @Put('runs/:id')
  @RequirePermissions({ resource: 'schedule', action: 'update' })
  @ApiParam({ name: 'id', description: 'Run ID' })
  @ApiOperation({ summary: 'Update a schedule run' })
  async updateRun(
    @Param('id') id: string,
    @Body() dto: UpdateScheduleRunDto,
    @Request() req: any,
  ) {
    return this.scheduleService.updateRun(id, dto, req.user?.id);
  }

  // Stop management
  @Post('runs/:id/stops')
  @RequirePermissions({ resource: 'schedule', action: 'update' })
  @ApiParam({ name: 'id', description: 'Run ID' })
  @ApiOperation({ summary: 'Add a stop to a run' })
  async addStop(
    @Param('id') id: string,
    @Body() dto: AddStopDto,
    @Request() req: any,
  ) {
    return this.scheduleService.addStop(id, dto, req.user?.id);
  }

  @Delete('runs/:runId/stops/:stopId')
  @RequirePermissions({ resource: 'schedule', action: 'update' })
  @ApiParam({ name: 'runId', description: 'Run ID' })
  @ApiParam({ name: 'stopId', description: 'Stop ID' })
  @ApiOperation({ summary: 'Remove a stop from a run' })
  async removeStop(
    @Param('runId') runId: string,
    @Param('stopId') stopId: string,
    @Request() req: any,
  ) {
    return this.scheduleService.removeStop(runId, stopId, req.user?.id);
  }

  @Put('runs/:id/stops/reorder')
  @RequirePermissions({ resource: 'schedule', action: 'update' })
  @ApiParam({ name: 'id', description: 'Run ID' })
  @ApiOperation({ summary: 'Reorder stops in a run' })
  async reorderStops(
    @Param('id') id: string,
    @Body() dto: ReorderStopsDto,
    @Request() req: any,
  ) {
    return this.scheduleService.reorderStops(id, dto, req.user?.id);
  }

  @Put('runs/:runId/stops/:stopId/status')
  @RequirePermissions({ resource: 'schedule', action: 'update' })
  @ApiParam({ name: 'runId', description: 'Run ID' })
  @ApiParam({ name: 'stopId', description: 'Stop ID' })
  @ApiOperation({ summary: 'Update stop status' })
  async updateStopStatus(
    @Param('runId') runId: string,
    @Param('stopId') stopId: string,
    @Body() dto: UpdateStopStatusDto,
    @Request() req: any,
  ) {
    return this.scheduleService.updateStopStatus(runId, stopId, dto, req.user?.id);
  }

  // Run state transitions
  @Post('runs/:id/ready')
  @RequirePermissions({ resource: 'schedule', action: 'update' })
  @ApiParam({ name: 'id', description: 'Run ID' })
  @ApiOperation({ summary: 'Mark run as ready' })
  async markReady(@Param('id') id: string, @Request() req: any) {
    return this.scheduleService.markReady(id, req.user?.id);
  }

  @Post('runs/:id/start')
  @RequirePermissions({ resource: 'schedule', action: 'update' })
  @ApiParam({ name: 'id', description: 'Run ID' })
  @ApiOperation({ summary: 'Start a run' })
  async startRun(
    @Param('id') id: string,
    @Body() dto: StartRunDto,
    @Request() req: any,
  ) {
    return this.scheduleService.startRun(id, dto, req.user?.id);
  }

  @Post('runs/:id/complete')
  @RequirePermissions({ resource: 'schedule', action: 'update' })
  @ApiParam({ name: 'id', description: 'Run ID' })
  @ApiOperation({ summary: 'Complete a run' })
  async completeRun(
    @Param('id') id: string,
    @Body() dto: CompleteRunDto,
    @Request() req: any,
  ) {
    return this.scheduleService.completeRun(id, dto, req.user?.id);
  }

  @Post('runs/:id/cancel')
  @RequirePermissions({ resource: 'schedule', action: 'delete' })
  @ApiParam({ name: 'id', description: 'Run ID' })
  @ApiOperation({ summary: 'Cancel a run' })
  async cancelRun(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req: any,
  ) {
    return this.scheduleService.cancelRun(id, reason, req.user?.id);
  }
}
