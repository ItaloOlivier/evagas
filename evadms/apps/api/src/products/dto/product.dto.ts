import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'CYL-9KG' })
  @IsString()
  sku: string;

  @ApiProperty({ example: '9kg LPG Cylinder' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Standard 9kg LPG cylinder for residential use' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['bulk_lpg', 'cylinder', 'delivery_fee', 'service'] })
  @IsEnum(['bulk_lpg', 'cylinder', 'delivery_fee', 'service'])
  productType: string;

  @ApiPropertyOptional({ example: 9 })
  @IsOptional()
  @IsNumber()
  cylinderSizeKg?: number;

  @ApiProperty({ example: 250.0 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ enum: ['litre', 'kg', 'each', 'trip'] })
  @IsEnum(['litre', 'kg', 'each', 'trip'])
  unitOfMeasure: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  vatApplicable?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'CYL-9KG' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ example: '9kg LPG Cylinder' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Standard 9kg LPG cylinder' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['bulk_lpg', 'cylinder', 'delivery_fee', 'service'] })
  @IsOptional()
  @IsEnum(['bulk_lpg', 'cylinder', 'delivery_fee', 'service'])
  productType?: string;

  @ApiPropertyOptional({ example: 9 })
  @IsOptional()
  @IsNumber()
  cylinderSizeKg?: number;

  @ApiPropertyOptional({ example: 250.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @ApiPropertyOptional({ enum: ['litre', 'kg', 'each', 'trip'] })
  @IsOptional()
  @IsEnum(['litre', 'kg', 'each', 'trip'])
  unitOfMeasure?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  vatApplicable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ProductQueryDto {
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
  @Max(100)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['bulk_lpg', 'cylinder', 'delivery_fee', 'service'] })
  @IsOptional()
  @IsEnum(['bulk_lpg', 'cylinder', 'delivery_fee', 'service'])
  productType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}

// Pricing Tier DTOs
export class CreatePricingTierDto {
  @ApiProperty({ example: 'B2B Premium' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Premium pricing for high-volume B2B customers' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 10, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdatePricingTierDto {
  @ApiPropertyOptional({ example: 'B2B Premium' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Premium pricing for high-volume B2B customers' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 10, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

// Tier Price DTOs (product-specific prices per tier)
export class SetTierPriceDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty()
  @IsUUID()
  pricingTierId: string;

  @ApiProperty({ example: 230.0 })
  @IsNumber()
  @Min(0)
  price: number;
}

// Customer-specific Price DTOs
export class SetCustomerPriceDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty()
  @IsUUID()
  customerId: string;

  @ApiProperty({ example: 220.0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  validFrom?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  validTo?: Date;
}

export class GetPriceDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity?: number;
}
