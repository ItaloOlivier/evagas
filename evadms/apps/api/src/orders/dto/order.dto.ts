import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsUUID,
  IsArray,
  ValidateNested,
  Min,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: 250.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @ApiPropertyOptional({ example: 10, description: 'Expected empty cylinders to collect' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  emptiesExpected?: number;
}

export class CreateOrderDto {
  @ApiProperty()
  @IsUUID()
  customerId: string;

  @ApiProperty()
  @IsUUID()
  siteId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  quoteId?: string;

  @ApiProperty({ enum: ['cylinder_delivery', 'bulk_delivery', 'cylinder_pickup', 'wholesale_pickup'] })
  @IsEnum(['cylinder_delivery', 'bulk_delivery', 'cylinder_pickup', 'wholesale_pickup'])
  orderType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  requestedDate?: string;

  @ApiPropertyOptional({ example: '08:00 - 12:00' })
  @IsOptional()
  @IsString()
  requestedWindow?: string;

  @ApiPropertyOptional({ enum: ['cod', 'eft', 'account', 'card'] })
  @IsOptional()
  @IsEnum(['cod', 'eft', 'account', 'card'])
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'Ring doorbell twice' })
  @IsOptional()
  @IsString()
  deliveryInstructions?: string;

  @ApiPropertyOptional({ example: 'Customer prefers morning delivery' })
  @IsOptional()
  @IsString()
  specialRequirements?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  internalNotes?: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}

export class UpdateOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  siteId?: string;

  @ApiPropertyOptional({ enum: ['cylinder_delivery', 'bulk_delivery', 'cylinder_pickup', 'wholesale_pickup'] })
  @IsOptional()
  @IsEnum(['cylinder_delivery', 'bulk_delivery', 'cylinder_pickup', 'wholesale_pickup'])
  orderType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  requestedDate?: string;

  @ApiPropertyOptional({ example: '08:00 - 12:00' })
  @IsOptional()
  @IsString()
  requestedWindow?: string;

  @ApiPropertyOptional({ enum: ['cod', 'eft', 'account', 'card'] })
  @IsOptional()
  @IsEnum(['cod', 'eft', 'account', 'card'])
  paymentMethod?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryInstructions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialRequirements?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  internalNotes?: string;
}

export class ScheduleOrderDto {
  @ApiProperty()
  @IsDateString()
  scheduledDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  routeId?: string;
}

export class PrepareOrderDto {
  @ApiPropertyOptional({ example: 'All items picked and packed' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class LoadOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  loadingChecklistId?: string;
}

export class DispatchOrderDto {
  @ApiProperty()
  @IsUUID()
  driverId: string;

  @ApiProperty()
  @IsUUID()
  vehicleId: string;
}

export class DeliverItemDto {
  @ApiProperty()
  @IsUUID()
  orderItemId: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0)
  quantityDelivered: number;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  emptiesCollected?: number;
}

export class CompleteDeliveryDto {
  @ApiProperty({ type: [DeliverItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliverItemDto)
  items: DeliverItemDto[];

  @ApiPropertyOptional({ example: 'Delivered to security guard' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class FailDeliveryDto {
  @ApiProperty({ example: 'Customer not home' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ example: 'Attempted 3 times, no answer' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CancelOrderDto {
  @ApiProperty({ example: 'Customer cancelled' })
  @IsString()
  reason: string;
}

export class UpdatePaymentDto {
  @ApiProperty({ enum: ['pending', 'paid', 'partial', 'overdue'] })
  @IsEnum(['pending', 'paid', 'partial', 'overdue'])
  paymentStatus: string;

  @ApiPropertyOptional({ example: 'EFT received ref: ABC123' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class OrderQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['created', 'scheduled', 'prepared', 'loading', 'dispatched', 'in_transit', 'arrived', 'delivered', 'partial_delivery', 'failed', 'cancelled', 'closed'] })
  @IsOptional()
  @IsEnum(['created', 'scheduled', 'prepared', 'loading', 'dispatched', 'in_transit', 'arrived', 'delivered', 'partial_delivery', 'failed', 'cancelled', 'closed'])
  status?: string;

  @ApiPropertyOptional({ enum: ['cylinder_delivery', 'bulk_delivery', 'cylinder_pickup', 'wholesale_pickup'] })
  @IsOptional()
  @IsEnum(['cylinder_delivery', 'bulk_delivery', 'cylinder_pickup', 'wholesale_pickup'])
  orderType?: string;

  @ApiPropertyOptional({ enum: ['pending', 'paid', 'partial', 'overdue'] })
  @IsOptional()
  @IsEnum(['pending', 'paid', 'partial', 'overdue'])
  paymentStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
