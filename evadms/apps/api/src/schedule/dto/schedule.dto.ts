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

// Vehicle DTOs
export class CreateVehicleDto {
  @ApiProperty({ example: 'ABC 123 GP' })
  @IsString()
  registrationNumber: string;

  @ApiProperty({ enum: ['bulk_tanker', 'cylinder_truck', 'van', 'bakkie'] })
  @IsEnum(['bulk_tanker', 'cylinder_truck', 'van', 'bakkie'])
  vehicleType: string;

  @ApiPropertyOptional({ example: 'Toyota' })
  @IsOptional()
  @IsString()
  make?: string;

  @ApiPropertyOptional({ example: 'Hino 300' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 2022 })
  @IsOptional()
  @IsNumber()
  year?: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bulkCapacityLitres?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cylinderCapacityUnits?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  licenseExpiry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  roadworthyExpiry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  insuranceExpiry?: string;

  @ApiPropertyOptional({ example: 150000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentOdometer?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateVehicleDto {
  @ApiPropertyOptional({ example: 'ABC 123 GP' })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({ enum: ['bulk_tanker', 'cylinder_truck', 'van', 'bakkie'] })
  @IsOptional()
  @IsEnum(['bulk_tanker', 'cylinder_truck', 'van', 'bakkie'])
  vehicleType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  make?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  bulkCapacityLitres?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  cylinderCapacityUnits?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  licenseExpiry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  roadworthyExpiry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  insuranceExpiry?: string;

  @ApiPropertyOptional({ enum: ['available', 'in_use', 'maintenance', 'out_of_service'] })
  @IsOptional()
  @IsEnum(['available', 'in_use', 'maintenance', 'out_of_service'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentOdometer?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

// Driver DTOs
export class CreateDriverDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ example: 'EMP001' })
  @IsOptional()
  @IsString()
  employeeNumber?: string;

  @ApiProperty({ example: '1234567890123' })
  @IsString()
  licenseNumber: string;

  @ApiProperty({ example: 'C1' })
  @IsString()
  licenseCode: string;

  @ApiProperty()
  @IsDateString()
  licenseExpiry: string;

  @ApiPropertyOptional({ example: 'PDP123456' })
  @IsOptional()
  @IsString()
  pdpNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  pdpExpiry?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  hazmatCertified?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  hazmatCertExpiry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  preferredVehicleId?: string;
}

export class UpdateDriverDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  licenseCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  licenseExpiry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pdpNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  pdpExpiry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  hazmatCertified?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  hazmatCertExpiry?: string;

  @ApiPropertyOptional({ enum: ['active', 'on_leave', 'suspended', 'inactive'] })
  @IsOptional()
  @IsEnum(['active', 'on_leave', 'suspended', 'inactive'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  preferredVehicleId?: string;
}

// Schedule Run DTOs
export class RouteStopDto {
  @ApiProperty()
  @IsUUID()
  orderId: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  sequenceNumber: number;

  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @IsString()
  estimatedArrival?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  estimatedDurationMinutes?: number;
}

export class CreateScheduleRunDto {
  @ApiProperty()
  @IsDateString()
  runDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiProperty({ enum: ['delivery', 'collection', 'mixed'] })
  @IsEnum(['delivery', 'collection', 'mixed'])
  runType: string;

  @ApiPropertyOptional({ example: '07:00' })
  @IsOptional()
  @IsString()
  plannedStartTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [RouteStopDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RouteStopDto)
  stops?: RouteStopDto[];
}

export class UpdateScheduleRunDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  runDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiPropertyOptional({ enum: ['delivery', 'collection', 'mixed'] })
  @IsOptional()
  @IsEnum(['delivery', 'collection', 'mixed'])
  runType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  plannedStartTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AddStopDto {
  @ApiProperty()
  @IsUUID()
  orderId: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  sequenceNumber?: number;

  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @IsString()
  estimatedArrival?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  estimatedDurationMinutes?: number;
}

export class ReorderStopsDto {
  @ApiProperty({ type: [String], description: 'Array of stop IDs in new order' })
  @IsArray()
  @IsUUID('4', { each: true })
  stopIds: string[];
}

export class StartRunDto {
  @ApiPropertyOptional({ example: 150234 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  startOdometer?: number;
}

export class CompleteRunDto {
  @ApiPropertyOptional({ example: 150456 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  endOdometer?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateStopStatusDto {
  @ApiProperty({ enum: ['pending', 'en_route', 'arrived', 'completed', 'skipped', 'failed'] })
  @IsEnum(['pending', 'en_route', 'arrived', 'completed', 'skipped', 'failed'])
  status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ScheduleQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ enum: ['planned', 'ready', 'in_progress', 'completed', 'cancelled'] })
  @IsOptional()
  @IsEnum(['planned', 'ready', 'in_progress', 'completed', 'cancelled'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vehicleId?: string;
}
