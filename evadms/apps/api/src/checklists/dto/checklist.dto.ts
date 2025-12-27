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
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export type ChecklistType =
  | 'bulk_receiving'
  | 'loading'
  | 'delivery'
  | 'vehicle_check'
  | 'refill_pre'
  | 'refill_qc'
  | 'safety'
  | 'audit'
  | 'custom';

export type ChecklistItemType =
  | 'yes_no'
  | 'yes_no_na'
  | 'text'
  | 'number'
  | 'photo'
  | 'signature'
  | 'select'
  | 'multi_select'
  | 'date'
  | 'time'
  | 'reading';

// Template Item DTOs
export class CreateChecklistItemDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  sequenceNumber: number;

  @ApiProperty({ example: 'Are all safety valves functional?' })
  @IsString()
  questionText: string;

  @ApiPropertyOptional({ example: 'Check each valve for proper operation' })
  @IsOptional()
  @IsString()
  helpText?: string;

  @ApiProperty({ enum: ['yes_no', 'yes_no_na', 'text', 'number', 'photo', 'signature', 'select', 'multi_select', 'date', 'time', 'reading'] })
  @IsEnum(['yes_no', 'yes_no_na', 'text', 'number', 'photo', 'signature', 'select', 'multi_select', 'date', 'time', 'reading'])
  itemType: ChecklistItemType;

  @ApiPropertyOptional({ type: [String], example: ['Option A', 'Option B', 'Option C'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isCritical?: boolean;

  @ApiPropertyOptional({ description: 'Show this item only if another item has specific value' })
  @IsOptional()
  @IsUUID()
  conditionalOnItemId?: string;

  @ApiPropertyOptional({ example: 'Yes' })
  @IsOptional()
  @IsString()
  conditionalValue?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  expectedRangeMin?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  expectedRangeMax?: number;

  @ApiPropertyOptional({ example: 'kPa' })
  @IsOptional()
  @IsString()
  unitOfMeasure?: string;
}

export class UpdateChecklistItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  sequenceNumber?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  questionText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  helpText?: string;

  @ApiPropertyOptional({ enum: ['yes_no', 'yes_no_na', 'text', 'number', 'photo', 'signature', 'select', 'multi_select', 'date', 'time', 'reading'] })
  @IsOptional()
  @IsEnum(['yes_no', 'yes_no_na', 'text', 'number', 'photo', 'signature', 'select', 'multi_select', 'date', 'time', 'reading'])
  itemType?: ChecklistItemType;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isCritical?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  conditionalOnItemId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  conditionalValue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  expectedRangeMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  expectedRangeMax?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unitOfMeasure?: string;
}

// Template DTOs
export class CreateChecklistTemplateDto {
  @ApiProperty({ example: 'LOADING_OUTBOUND' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Outbound Loading Checklist' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Checklist for vehicle loading before dispatch' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['bulk_receiving', 'loading', 'delivery', 'vehicle_check', 'refill_pre', 'refill_qc', 'safety', 'audit', 'custom'] })
  @IsEnum(['bulk_receiving', 'loading', 'delivery', 'vehicle_check', 'refill_pre', 'refill_qc', 'safety', 'audit', 'custom'])
  templateType: ChecklistType;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @ApiPropertyOptional({ default: false, description: 'If true, workflow stops on critical item failure' })
  @IsOptional()
  @IsBoolean()
  blocksOnFailure?: boolean;

  @ApiPropertyOptional({ type: [CreateChecklistItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateChecklistItemDto)
  items?: CreateChecklistItemDto[];
}

export class UpdateChecklistTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  blocksOnFailure?: boolean;
}

// Response DTOs
export class AnswerItemDto {
  @ApiProperty()
  @IsUUID()
  itemId: string;

  @ApiPropertyOptional({ example: 'Yes' })
  @IsOptional()
  @IsString()
  answerValue?: string;

  @ApiPropertyOptional({ example: 150.5 })
  @IsOptional()
  @IsNumber()
  numericValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  attachmentId?: string;

  @ApiPropertyOptional({ example: 'Minor damage noted on valve 3' })
  @IsOptional()
  @IsString()
  issueNotes?: string;
}

export class StartChecklistResponseDto {
  @ApiProperty()
  @IsUUID()
  templateId: string;

  @ApiProperty({ example: 'order', description: 'Type of entity this checklist is for' })
  @IsString()
  contextType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  contextId?: string;

  @ApiPropertyOptional({ example: -25.9692 })
  @IsOptional()
  @IsNumber()
  gpsLatitude?: number;

  @ApiPropertyOptional({ example: 28.1283 })
  @IsOptional()
  @IsNumber()
  gpsLongitude?: number;
}

export class SubmitAnswersDto {
  @ApiProperty({ type: [AnswerItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerItemDto)
  answers: AnswerItemDto[];

  @ApiPropertyOptional({ example: -25.9692 })
  @IsOptional()
  @IsNumber()
  gpsLatitude?: number;

  @ApiPropertyOptional({ example: 28.1283 })
  @IsOptional()
  @IsNumber()
  gpsLongitude?: number;
}

export class CompleteChecklistDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: -25.9692 })
  @IsOptional()
  @IsNumber()
  gpsLatitude?: number;

  @ApiPropertyOptional({ example: 28.1283 })
  @IsOptional()
  @IsNumber()
  gpsLongitude?: number;
}

// Query DTOs
export class TemplateQueryDto {
  @ApiPropertyOptional({ enum: ['bulk_receiving', 'loading', 'delivery', 'vehicle_check', 'refill_pre', 'refill_qc', 'safety', 'audit', 'custom'] })
  @IsOptional()
  @IsEnum(['bulk_receiving', 'loading', 'delivery', 'vehicle_check', 'refill_pre', 'refill_qc', 'safety', 'audit', 'custom'])
  templateType?: ChecklistType;

  @ApiPropertyOptional({ enum: ['draft', 'active', 'archived'] })
  @IsOptional()
  @IsEnum(['draft', 'active', 'archived'])
  status?: string;
}

export class ResponseQueryDto {
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
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contextType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  contextId?: string;

  @ApiPropertyOptional({ enum: ['in_progress', 'completed', 'failed', 'abandoned'] })
  @IsOptional()
  @IsEnum(['in_progress', 'completed', 'failed', 'abandoned'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  passed?: boolean;
}
