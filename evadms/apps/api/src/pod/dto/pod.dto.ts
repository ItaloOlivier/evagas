import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsUUID,
  IsArray,
  IsBoolean,
  ValidateNested,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export type PODOutcome = 'delivered' | 'partial' | 'refused' | 'no_access' | 'not_home' | 'other';
export type PODPhotoType = 'delivery_location' | 'product_placement' | 'damage' | 'signature' | 'other';

// Photo DTOs
export class AddPhotoDto {
  @ApiProperty({ enum: ['delivery_location', 'product_placement', 'damage', 'signature', 'other'] })
  @IsEnum(['delivery_location', 'product_placement', 'damage', 'signature', 'other'])
  photoType: PODPhotoType;

  @ApiProperty()
  @IsUUID()
  attachmentId: string;

  @ApiPropertyOptional({ example: 'Cylinders placed in storage area' })
  @IsOptional()
  @IsString()
  caption?: string;
}

// Delivery Item DTO
export class DeliveryItemDto {
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

// Create POD DTO
export class CreatePODDto {
  @ApiProperty()
  @IsUUID()
  orderId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  routeStopId?: string;

  @ApiPropertyOptional({ example: -25.9692 })
  @IsOptional()
  @IsNumber()
  gpsLatitude?: number;

  @ApiPropertyOptional({ example: 28.1283 })
  @IsOptional()
  @IsNumber()
  gpsLongitude?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  gpsAccuracyMeters?: number;

  @ApiProperty({ enum: ['delivered', 'partial', 'refused', 'no_access', 'not_home', 'other'] })
  @IsEnum(['delivered', 'partial', 'refused', 'no_access', 'not_home', 'other'])
  outcome: PODOutcome;

  @ApiPropertyOptional({ example: 'Customer requested delivery to back door' })
  @IsOptional()
  @IsString()
  outcomeNotes?: string;

  @ApiPropertyOptional({ example: 'John Smith' })
  @IsOptional()
  @IsString()
  receivedByName?: string;

  @ApiPropertyOptional({ example: '+27821234567' })
  @IsOptional()
  @IsString()
  receivedByPhone?: string;

  @ApiPropertyOptional({ example: 'All items delivered as requested' })
  @IsOptional()
  @IsString()
  driverNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  appVersion?: string;

  @ApiProperty({ type: [DeliveryItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryItemDto)
  items: DeliveryItemDto[];

  @ApiPropertyOptional({ type: [AddPhotoDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddPhotoDto)
  photos?: AddPhotoDto[];
}

// Add Signature DTO
export class AddSignatureDto {
  @ApiProperty()
  @IsUUID()
  attachmentId: string;

  @ApiProperty({ example: 'John Smith' })
  @IsString()
  signatoryName: string;

  @ApiPropertyOptional({ example: 'Store Manager' })
  @IsOptional()
  @IsString()
  signatoryDesignation?: string;
}

// Failed Delivery DTO
export class FailedDeliveryDto {
  @ApiProperty()
  @IsUUID()
  orderId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  routeStopId?: string;

  @ApiProperty({ enum: ['refused', 'no_access', 'not_home', 'other'] })
  @IsEnum(['refused', 'no_access', 'not_home', 'other'])
  outcome: PODOutcome;

  @ApiProperty({ example: 'Security would not allow entry without appointment' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ example: -25.9692 })
  @IsOptional()
  @IsNumber()
  gpsLatitude?: number;

  @ApiPropertyOptional({ example: 28.1283 })
  @IsOptional()
  @IsNumber()
  gpsLongitude?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  gpsAccuracyMeters?: number;

  @ApiPropertyOptional({ type: [AddPhotoDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddPhotoDto)
  photos?: AddPhotoDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  appVersion?: string;
}

// Query DTOs
export class PODQueryDto {
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
  @IsUUID()
  orderId?: string;

  @ApiPropertyOptional({ enum: ['delivered', 'partial', 'refused', 'no_access', 'not_home', 'other'] })
  @IsOptional()
  @IsEnum(['delivered', 'partial', 'refused', 'no_access', 'not_home', 'other'])
  outcome?: PODOutcome;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  signatureCaptured?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  toDate?: string;
}
