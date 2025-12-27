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
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  UpdateOrderDto,
  OrderQueryDto,
  ScheduleOrderDto,
  DispatchOrderDto,
  CompleteDeliveryDto,
  FailDeliveryDto,
  CancelOrderDto,
  UpdatePaymentDto,
} from './dto/order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @RequirePermissions({ resource: 'orders', action: 'read' })
  @ApiOperation({ summary: 'Get all orders with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated orders list' })
  async findAll(@Query() query: OrderQueryDto) {
    return this.ordersService.findAll(query);
  }

  @Get('statistics')
  @RequirePermissions({ resource: 'orders', action: 'read' })
  @ApiOperation({ summary: 'Get order statistics' })
  @ApiResponse({ status: 200, description: 'Returns order statistics' })
  async getStatistics(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.ordersService.getStatistics(
      fromDate ? new Date(fromDate) : undefined,
      toDate ? new Date(toDate) : undefined,
    );
  }

  @Get('ready-for-dispatch')
  @RequirePermissions({ resource: 'orders', action: 'read' })
  @ApiOperation({ summary: 'Get orders ready for dispatch' })
  @ApiResponse({ status: 200, description: 'Returns orders ready for dispatch' })
  async getReadyForDispatch(@Query('date') date?: string) {
    return this.ordersService.getReadyForDispatch(date ? new Date(date) : undefined);
  }

  @Get(':id')
  @RequirePermissions({ resource: 'orders', action: 'read' })
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Returns order details' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findById(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Get('number/:orderNumber')
  @RequirePermissions({ resource: 'orders', action: 'read' })
  @ApiOperation({ summary: 'Get order by order number' })
  @ApiParam({ name: 'orderNumber', description: 'Order number' })
  @ApiResponse({ status: 200, description: 'Returns order details' })
  async findByOrderNumber(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.findByOrderNumber(orderNumber);
  }

  @Post()
  @RequirePermissions({ resource: 'orders', action: 'create' })
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() dto: CreateOrderDto, @Request() req: any) {
    return this.ordersService.create(dto, req.user?.id);
  }

  @Put(':id')
  @RequirePermissions({ resource: 'orders', action: 'update' })
  @ApiOperation({ summary: 'Update an order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order updated successfully' })
  @ApiResponse({ status: 400, description: 'Order can only be updated in created/scheduled status' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
    @Request() req: any,
  ) {
    return this.ordersService.update(id, dto, req.user?.id);
  }

  // State transitions
  @Post(':id/schedule')
  @RequirePermissions({ resource: 'orders', action: 'update' })
  @ApiOperation({ summary: 'Schedule order for delivery' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order scheduled successfully' })
  async schedule(
    @Param('id') id: string,
    @Body() dto: ScheduleOrderDto,
    @Request() req: any,
  ) {
    return this.ordersService.schedule(id, dto, req.user?.id);
  }

  @Post(':id/prepare')
  @RequirePermissions({ resource: 'orders', action: 'update' })
  @ApiOperation({ summary: 'Mark order as prepared' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order marked as prepared' })
  async prepare(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.prepare(id, req.user?.id);
  }

  @Post(':id/load')
  @RequirePermissions({ resource: 'orders', action: 'update' })
  @ApiOperation({ summary: 'Mark order as loading' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order marked as loading' })
  async load(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.load(id, req.user?.id);
  }

  @Post(':id/dispatch')
  @RequirePermissions({ resource: 'orders', action: 'update' })
  @ApiOperation({ summary: 'Dispatch order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order dispatched successfully' })
  async dispatch(
    @Param('id') id: string,
    @Body() dto: DispatchOrderDto,
    @Request() req: any,
  ) {
    return this.ordersService.dispatch(id, dto, req.user?.id);
  }

  @Post(':id/start-transit')
  @RequirePermissions({ resource: 'orders', action: 'update' })
  @ApiOperation({ summary: 'Mark order as in transit' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order marked as in transit' })
  async startTransit(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.startTransit(id, req.user?.id);
  }

  @Post(':id/arrive')
  @RequirePermissions({ resource: 'orders', action: 'update' })
  @ApiOperation({ summary: 'Mark order as arrived at destination' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order marked as arrived' })
  async arrive(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.arrive(id, req.user?.id);
  }

  @Post(':id/complete')
  @RequirePermissions({ resource: 'orders', action: 'update' })
  @ApiOperation({ summary: 'Complete delivery' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Delivery completed successfully' })
  async completeDelivery(
    @Param('id') id: string,
    @Body() dto: CompleteDeliveryDto,
    @Request() req: any,
  ) {
    return this.ordersService.completeDelivery(id, dto, req.user?.id);
  }

  @Post(':id/fail')
  @RequirePermissions({ resource: 'orders', action: 'update' })
  @ApiOperation({ summary: 'Mark delivery as failed' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Delivery marked as failed' })
  async failDelivery(
    @Param('id') id: string,
    @Body() dto: FailDeliveryDto,
    @Request() req: any,
  ) {
    return this.ordersService.failDelivery(id, dto, req.user?.id);
  }

  @Post(':id/cancel')
  @RequirePermissions({ resource: 'orders', action: 'delete' })
  @ApiOperation({ summary: 'Cancel order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
    @Request() req: any,
  ) {
    return this.ordersService.cancel(id, dto, req.user?.id);
  }

  @Post(':id/close')
  @RequirePermissions({ resource: 'orders', action: 'update' })
  @ApiOperation({ summary: 'Close order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order closed successfully' })
  async close(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.close(id, req.user?.id);
  }

  @Put(':id/payment')
  @RequirePermissions({ resource: 'orders', action: 'update' })
  @ApiOperation({ summary: 'Update payment status' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Payment status updated' })
  async updatePayment(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentDto,
    @Request() req: any,
  ) {
    return this.ordersService.updatePayment(id, dto, req.user?.id);
  }
}
