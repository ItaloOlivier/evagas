import {
  Controller,
  Get,
  Post,
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
import { PODService } from './pod.service';
import {
  CreatePODDto,
  AddSignatureDto,
  FailedDeliveryDto,
  AddPhotoDto,
  PODQueryDto,
} from './dto/pod.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Proof of Delivery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('pod')
export class PODController {
  constructor(private readonly podService: PODService) {}

  @Get()
  @RequirePermissions({ resource: 'orders', action: 'read' })
  @ApiOperation({ summary: 'Get all PODs with filters' })
  @ApiResponse({ status: 200, description: 'Returns paginated PODs list' })
  async findAll(@Query() query: PODQueryDto) {
    return this.podService.findAll(query);
  }

  @Get('statistics')
  @RequirePermissions({ resource: 'orders', action: 'read' })
  @ApiOperation({ summary: 'Get POD statistics' })
  @ApiResponse({ status: 200, description: 'Returns POD statistics' })
  async getStatistics(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.podService.getStatistics(
      fromDate ? new Date(fromDate) : undefined,
      toDate ? new Date(toDate) : undefined,
    );
  }

  @Get('driver/:driverId')
  @RequirePermissions({ resource: 'orders', action: 'read' })
  @ApiParam({ name: 'driverId', description: 'Driver ID' })
  @ApiOperation({ summary: 'Get driver\'s PODs for a date' })
  async getDriverPODs(
    @Param('driverId') driverId: string,
    @Query('date') date: string,
  ) {
    return this.podService.getDriverPODs(driverId, new Date(date));
  }

  @Get(':id')
  @RequirePermissions({ resource: 'orders', action: 'read' })
  @ApiParam({ name: 'id', description: 'POD ID' })
  @ApiOperation({ summary: 'Get POD by ID' })
  @ApiResponse({ status: 200, description: 'Returns POD details' })
  @ApiResponse({ status: 404, description: 'POD not found' })
  async findById(@Param('id') id: string) {
    return this.podService.findById(id);
  }

  @Get('order/:orderId')
  @RequirePermissions({ resource: 'orders', action: 'read' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiOperation({ summary: 'Get POD by order ID' })
  @ApiResponse({ status: 200, description: 'Returns POD for order' })
  async findByOrder(@Param('orderId') orderId: string) {
    return this.podService.findByOrder(orderId);
  }

  @Post()
  @RequirePermissions({ resource: 'orders', action: 'update' })
  @ApiOperation({ summary: 'Create POD for successful/partial delivery' })
  @ApiResponse({ status: 201, description: 'POD created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid order status or POD exists' })
  async create(@Body() dto: CreatePODDto, @Request() req: any) {
    return this.podService.createPOD(dto, req.user.id);
  }

  @Post('failed')
  @RequirePermissions({ resource: 'orders', action: 'update' })
  @ApiOperation({ summary: 'Record a failed delivery' })
  @ApiResponse({ status: 201, description: 'Failed delivery recorded' })
  @ApiResponse({ status: 400, description: 'Invalid order status' })
  async createFailed(@Body() dto: FailedDeliveryDto, @Request() req: any) {
    return this.podService.createFailedDelivery(dto, req.user.id);
  }

  @Post(':id/signature')
  @RequirePermissions({ resource: 'orders', action: 'update' })
  @ApiParam({ name: 'id', description: 'POD ID' })
  @ApiOperation({ summary: 'Add signature to POD' })
  @ApiResponse({ status: 200, description: 'Signature added successfully' })
  async addSignature(
    @Param('id') id: string,
    @Body() dto: AddSignatureDto,
    @Request() req: any,
  ) {
    return this.podService.addSignature(id, dto, req.user.id);
  }

  @Post(':id/photos')
  @RequirePermissions({ resource: 'orders', action: 'update' })
  @ApiParam({ name: 'id', description: 'POD ID' })
  @ApiOperation({ summary: 'Add photo to POD' })
  @ApiResponse({ status: 201, description: 'Photo added successfully' })
  async addPhoto(
    @Param('id') id: string,
    @Body() dto: AddPhotoDto,
    @Request() req: any,
  ) {
    return this.podService.addPhoto(id, dto, req.user.id);
  }
}
