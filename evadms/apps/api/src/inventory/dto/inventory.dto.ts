import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsUUID,
  IsBoolean,
  Min,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// Cylinder sizes
export type CylinderSize = '9kg' | '14kg' | '19kg' | '48kg';
export type CylinderStatus = 'full' | 'empty' | 'quarantine' | 'maintenance' | 'issued' | 'in_transit' | 'at_customer';
export type CylinderMovementType =
  | 'receive_empty'
  | 'refill'
  | 'issue'
  | 'deliver'
  | 'collect_empty'
  | 'return_full'
  | 'quarantine'
  | 'release_quarantine'
  | 'maintenance'
  | 'release_maintenance'
  | 'scrap'
  | 'purchase'
  | 'adjustment'
  | 'transfer_in'
  | 'transfer_out';

// Movement DTOs
export class CreateCylinderMovementDto {
  @ApiProperty({ enum: ['9kg', '14kg', '19kg', '48kg'] })
  @IsEnum(['9kg', '14kg', '19kg', '48kg'])
  cylinderSize: CylinderSize;

  @ApiProperty({ enum: ['receive_empty', 'refill', 'issue', 'deliver', 'collect_empty', 'return_full', 'quarantine', 'release_quarantine', 'maintenance', 'release_maintenance', 'scrap', 'purchase', 'adjustment', 'transfer_in', 'transfer_out'] })
  @IsEnum(['receive_empty', 'refill', 'issue', 'deliver', 'collect_empty', 'return_full', 'quarantine', 'release_quarantine', 'maintenance', 'release_maintenance', 'scrap', 'purchase', 'adjustment', 'transfer_in', 'transfer_out'])
  movementType: CylinderMovementType;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  refillBatchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  routeStopId?: string;

  @ApiPropertyOptional({ example: 'Collected from customer ABC123' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AdjustmentDto {
  @ApiProperty({ enum: ['9kg', '14kg', '19kg', '48kg'] })
  @IsEnum(['9kg', '14kg', '19kg', '48kg'])
  cylinderSize: CylinderSize;

  @ApiProperty({ enum: ['full', 'empty', 'quarantine', 'maintenance'] })
  @IsEnum(['full', 'empty', 'quarantine', 'maintenance'])
  status: CylinderStatus;

  @ApiProperty({ example: 5, description: 'Positive for increase, negative for decrease' })
  @IsNumber()
  adjustment: number;

  @ApiProperty({ example: 'Physical count variance' })
  @IsString()
  reason: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ApproveVarianceDto {
  @ApiProperty()
  @IsUUID()
  movementId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

// Refill Batch DTOs
export class CreateRefillBatchDto {
  @ApiProperty({ enum: ['9kg', '14kg', '19kg', '48kg'] })
  @IsEnum(['9kg', '14kg', '19kg', '48kg'])
  cylinderSize: CylinderSize;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class StartInspectionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  preFillChecklistId?: string;
}

export class CompleteInspectionDto {
  @ApiProperty({ example: 48 })
  @IsNumber()
  @Min(0)
  passedCount: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(0)
  failedCount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class StartFillingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fillStationId?: string;
}

export class CompleteFillingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CompleteQCDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  qcChecklistId?: string;

  @ApiProperty({ example: 48 })
  @IsNumber()
  @Min(0)
  passedCount: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @Min(0)
  failedCount: number;
}

export class StockBatchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

// Tank DTOs (for bulk storage)
export class CreateTankDto {
  @ApiProperty({ example: 'TANK-001' })
  @IsString()
  tankCode: string;

  @ApiPropertyOptional({ example: 'Main Storage Tank' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 50000, description: 'Capacity in litres' })
  @IsNumber()
  @Min(1)
  capacityLitres: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumLevelLitres?: number;

  @ApiPropertyOptional({ example: 48000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maximumLevelLitres?: number;
}

export class UpdateTankDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumLevelLitres?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  maximumLevelLitres?: number;

  @ApiPropertyOptional({ enum: ['active', 'maintenance', 'decommissioned'] })
  @IsOptional()
  @IsEnum(['active', 'maintenance', 'decommissioned'])
  status?: string;
}

export class RecordTankReadingDto {
  @ApiProperty()
  @IsUUID()
  tankId: string;

  @ApiProperty({ example: 35000 })
  @IsNumber()
  @Min(0)
  levelLitres: number;

  @ApiPropertyOptional({ example: 15.5 })
  @IsOptional()
  @IsNumber()
  temperatureCelsius?: number;

  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @IsNumber()
  pressureKpa?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateBulkMovementDto {
  @ApiProperty()
  @IsUUID()
  tankId: string;

  @ApiProperty({ enum: ['receive', 'dispense', 'transfer_in', 'transfer_out', 'adjustment', 'loss'] })
  @IsEnum(['receive', 'dispense', 'transfer_in', 'transfer_out', 'adjustment', 'loss'])
  movementType: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  quantityLitres: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierDeliveryRef?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

// Query DTOs
export class MovementQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ enum: ['9kg', '14kg', '19kg', '48kg'] })
  @IsOptional()
  @IsEnum(['9kg', '14kg', '19kg', '48kg'])
  cylinderSize?: CylinderSize;

  @ApiPropertyOptional({ enum: ['receive_empty', 'refill', 'issue', 'deliver', 'collect_empty', 'return_full', 'quarantine', 'release_quarantine', 'maintenance', 'release_maintenance', 'scrap', 'purchase', 'adjustment', 'transfer_in', 'transfer_out'] })
  @IsOptional()
  movementType?: CylinderMovementType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  pendingApproval?: boolean;
}

export class RefillBatchQueryDto {
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

  @ApiPropertyOptional({ enum: ['9kg', '14kg', '19kg', '48kg'] })
  @IsOptional()
  @IsEnum(['9kg', '14kg', '19kg', '48kg'])
  cylinderSize?: CylinderSize;

  @ApiPropertyOptional({ enum: ['created', 'inspecting', 'filling', 'qc', 'passed', 'failed', 'stocked'] })
  @IsOptional()
  @IsEnum(['created', 'inspecting', 'filling', 'qc', 'passed', 'failed', 'stocked'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
