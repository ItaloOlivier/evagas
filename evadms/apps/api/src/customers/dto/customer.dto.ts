import {
  IsString,
  IsOptional,
  IsEnum,
  IsEmail,
  IsNumber,
  IsBoolean,
  ValidateNested,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateSiteDto {
  @ApiPropertyOptional({ example: 'Main Warehouse' })
  @IsOptional()
  @IsString()
  siteName?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiProperty({ example: '123 Industrial Road' })
  @IsString()
  streetAddress: string;

  @ApiPropertyOptional({ example: 'Midrand' })
  @IsOptional()
  @IsString()
  suburb?: string;

  @ApiProperty({ example: 'Johannesburg' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'Gauteng' })
  @IsString()
  province: string;

  @ApiPropertyOptional({ example: '1685' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ example: -25.9692 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 28.1283 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 'Enter through back gate, security code 1234' })
  @IsOptional()
  @IsString()
  deliveryInstructions?: string;

  @ApiPropertyOptional({ example: 'Forklift required for offloading' })
  @IsOptional()
  @IsString()
  accessRequirements?: string;

  @ApiPropertyOptional({ example: '08:00 - 16:00' })
  @IsOptional()
  @IsString()
  preferredDeliveryWindow?: string;

  @ApiPropertyOptional({ example: 'John Smith' })
  @IsOptional()
  @IsString()
  siteContactName?: string;

  @ApiPropertyOptional({ example: '+27821234567' })
  @IsOptional()
  @IsString()
  siteContactPhone?: string;
}

export class UpdateSiteDto {
  @ApiPropertyOptional({ example: 'Main Warehouse' })
  @IsOptional()
  @IsString()
  siteName?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ example: '123 Industrial Road' })
  @IsOptional()
  @IsString()
  streetAddress?: string;

  @ApiPropertyOptional({ example: 'Midrand' })
  @IsOptional()
  @IsString()
  suburb?: string;

  @ApiPropertyOptional({ example: 'Johannesburg' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Gauteng' })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({ example: '1685' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ example: -25.9692 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 28.1283 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 'Enter through back gate' })
  @IsOptional()
  @IsString()
  deliveryInstructions?: string;

  @ApiPropertyOptional({ example: 'Forklift required' })
  @IsOptional()
  @IsString()
  accessRequirements?: string;

  @ApiPropertyOptional({ example: '08:00 - 16:00' })
  @IsOptional()
  @IsString()
  preferredDeliveryWindow?: string;

  @ApiPropertyOptional({ example: 'John Smith' })
  @IsOptional()
  @IsString()
  siteContactName?: string;

  @ApiPropertyOptional({ example: '+27821234567' })
  @IsOptional()
  @IsString()
  siteContactPhone?: string;

  @ApiPropertyOptional({ enum: ['active', 'inactive'] })
  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;
}

export class CreateCustomerDto {
  @ApiPropertyOptional({ example: 'ABC Distributors Pty Ltd' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ enum: ['retail', 'b2b', 'wholesale'] })
  @IsEnum(['retail', 'b2b', 'wholesale'])
  customerType: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  primaryContactName?: string;

  @ApiPropertyOptional({ example: '+27821234567' })
  @IsOptional()
  @IsString()
  primaryPhone?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  primaryEmail?: string;

  @ApiPropertyOptional({ example: '4123456789' })
  @IsOptional()
  @IsString()
  vatNumber?: string;

  @ApiPropertyOptional({ example: '2023/123456/07' })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  pricingTierId?: string;

  @ApiPropertyOptional({ example: 5, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  creditLimit?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  paymentTermsDays?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  commEmail?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  commSms?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  commWhatsapp?: boolean;

  @ApiPropertyOptional({ enum: ['phone', 'email', 'sms', 'whatsapp'] })
  @IsOptional()
  @IsEnum(['phone', 'email', 'sms', 'whatsapp'])
  preferredContactMethod?: string;

  @ApiPropertyOptional({ enum: ['active', 'inactive', 'on_hold', 'blacklisted'] })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'on_hold', 'blacklisted'])
  status?: string;

  @ApiPropertyOptional({ example: 'VIP customer, handle with care' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: CreateSiteDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateSiteDto)
  primarySite?: CreateSiteDto;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional({ example: 'ABC Distributors Pty Ltd' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ enum: ['retail', 'b2b', 'wholesale'] })
  @IsOptional()
  @IsEnum(['retail', 'b2b', 'wholesale'])
  customerType?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  primaryContactName?: string;

  @ApiPropertyOptional({ example: '+27821234567' })
  @IsOptional()
  @IsString()
  primaryPhone?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  primaryEmail?: string;

  @ApiPropertyOptional({ example: '4123456789' })
  @IsOptional()
  @IsString()
  vatNumber?: string;

  @ApiPropertyOptional({ example: '2023/123456/07' })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  pricingTierId?: string;

  @ApiPropertyOptional({ example: 5, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  creditLimit?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  paymentTermsDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  commEmail?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  commSms?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  commWhatsapp?: boolean;

  @ApiPropertyOptional({ enum: ['phone', 'email', 'sms', 'whatsapp'] })
  @IsOptional()
  @IsEnum(['phone', 'email', 'sms', 'whatsapp'])
  preferredContactMethod?: string;

  @ApiPropertyOptional({ enum: ['active', 'inactive', 'on_hold', 'blacklisted'] })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'on_hold', 'blacklisted'])
  status?: string;

  @ApiPropertyOptional({ example: 'VIP customer, handle with care' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CustomerQueryDto {
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
  @Max(100)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['retail', 'b2b', 'wholesale'] })
  @IsOptional()
  @IsEnum(['retail', 'b2b', 'wholesale'])
  customerType?: string;

  @ApiPropertyOptional({ enum: ['active', 'inactive', 'on_hold', 'blacklisted'] })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'on_hold', 'blacklisted'])
  status?: string;
}
