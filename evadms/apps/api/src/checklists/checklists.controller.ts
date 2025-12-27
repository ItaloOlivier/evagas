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
import { ChecklistsService } from './checklists.service';
import {
  CreateChecklistTemplateDto,
  UpdateChecklistTemplateDto,
  CreateChecklistItemDto,
  UpdateChecklistItemDto,
  StartChecklistResponseDto,
  SubmitAnswersDto,
  CompleteChecklistDto,
  TemplateQueryDto,
  ResponseQueryDto,
} from './dto/checklist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Checklist Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('checklists/templates')
export class ChecklistTemplatesController {
  constructor(private readonly checklistsService: ChecklistsService) {}

  @Get()
  @RequirePermissions({ resource: 'checklists', action: 'read' })
  @ApiOperation({ summary: 'Get all checklist templates' })
  async findAll(@Query() query: TemplateQueryDto) {
    return this.checklistsService.findAllTemplates(query);
  }

  @Get(':id')
  @RequirePermissions({ resource: 'checklists', action: 'read' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiOperation({ summary: 'Get template by ID' })
  async findById(@Param('id') id: string) {
    return this.checklistsService.findTemplateById(id);
  }

  @Get('code/:code')
  @RequirePermissions({ resource: 'checklists', action: 'read' })
  @ApiParam({ name: 'code', description: 'Template code' })
  @ApiOperation({ summary: 'Get template by code' })
  async findByCode(@Param('code') code: string) {
    return this.checklistsService.findTemplateByCode(code);
  }

  @Post()
  @RequirePermissions({ resource: 'checklists', action: 'create' })
  @ApiOperation({ summary: 'Create a new template' })
  async create(@Body() dto: CreateChecklistTemplateDto, @Request() req: any) {
    return this.checklistsService.createTemplate(dto, req.user.id);
  }

  @Put(':id')
  @RequirePermissions({ resource: 'checklists', action: 'update' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiOperation({ summary: 'Update a template' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateChecklistTemplateDto,
    @Request() req: any,
  ) {
    return this.checklistsService.updateTemplate(id, dto, req.user.id);
  }

  @Post(':id/items')
  @RequirePermissions({ resource: 'checklists', action: 'update' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiOperation({ summary: 'Add an item to a template' })
  async addItem(
    @Param('id') id: string,
    @Body() dto: CreateChecklistItemDto,
    @Request() req: any,
  ) {
    return this.checklistsService.addItem(id, dto, req.user.id);
  }

  @Put(':templateId/items/:itemId')
  @RequirePermissions({ resource: 'checklists', action: 'update' })
  @ApiParam({ name: 'templateId', description: 'Template ID' })
  @ApiParam({ name: 'itemId', description: 'Item ID' })
  @ApiOperation({ summary: 'Update an item in a template' })
  async updateItem(
    @Param('templateId') templateId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateChecklistItemDto,
    @Request() req: any,
  ) {
    return this.checklistsService.updateItem(templateId, itemId, dto, req.user.id);
  }

  @Delete(':templateId/items/:itemId')
  @RequirePermissions({ resource: 'checklists', action: 'update' })
  @ApiParam({ name: 'templateId', description: 'Template ID' })
  @ApiParam({ name: 'itemId', description: 'Item ID' })
  @ApiOperation({ summary: 'Remove an item from a template' })
  async removeItem(
    @Param('templateId') templateId: string,
    @Param('itemId') itemId: string,
    @Request() req: any,
  ) {
    return this.checklistsService.removeItem(templateId, itemId, req.user.id);
  }

  @Post(':id/activate')
  @RequirePermissions({ resource: 'checklists', action: 'approve' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiOperation({ summary: 'Activate a template' })
  async activate(@Param('id') id: string, @Request() req: any) {
    return this.checklistsService.activateTemplate(id, req.user.id);
  }

  @Post(':id/archive')
  @RequirePermissions({ resource: 'checklists', action: 'update' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiOperation({ summary: 'Archive a template' })
  async archive(@Param('id') id: string, @Request() req: any) {
    return this.checklistsService.archiveTemplate(id, req.user.id);
  }

  @Post(':id/new-version')
  @RequirePermissions({ resource: 'checklists', action: 'create' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiOperation({ summary: 'Create a new version of a template' })
  async createNewVersion(@Param('id') id: string, @Request() req: any) {
    return this.checklistsService.createNewVersion(id, req.user.id);
  }
}

@ApiTags('Checklist Responses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('checklists/responses')
export class ChecklistResponsesController {
  constructor(private readonly checklistsService: ChecklistsService) {}

  @Get()
  @RequirePermissions({ resource: 'checklists', action: 'read' })
  @ApiOperation({ summary: 'Get all checklist responses' })
  async findAll(@Query() query: ResponseQueryDto) {
    return this.checklistsService.findAllResponses(query);
  }

  @Get(':id')
  @RequirePermissions({ resource: 'checklists', action: 'read' })
  @ApiParam({ name: 'id', description: 'Response ID' })
  @ApiOperation({ summary: 'Get response by ID' })
  async findById(@Param('id') id: string) {
    return this.checklistsService.findResponseById(id);
  }

  @Post('start')
  @RequirePermissions({ resource: 'checklists', action: 'create' })
  @ApiOperation({ summary: 'Start a new checklist response' })
  async start(@Body() dto: StartChecklistResponseDto, @Request() req: any) {
    return this.checklistsService.startResponse(dto, req.user.id);
  }

  @Post(':id/answers')
  @RequirePermissions({ resource: 'checklists', action: 'update' })
  @ApiParam({ name: 'id', description: 'Response ID' })
  @ApiOperation({ summary: 'Submit answers for a response' })
  async submitAnswers(
    @Param('id') id: string,
    @Body() dto: SubmitAnswersDto,
    @Request() req: any,
  ) {
    return this.checklistsService.submitAnswers(id, dto, req.user.id);
  }

  @Post(':id/complete')
  @RequirePermissions({ resource: 'checklists', action: 'update' })
  @ApiParam({ name: 'id', description: 'Response ID' })
  @ApiOperation({ summary: 'Complete a response' })
  async complete(
    @Param('id') id: string,
    @Body() dto: CompleteChecklistDto,
    @Request() req: any,
  ) {
    return this.checklistsService.completeResponse(id, dto, req.user.id);
  }

  @Post(':id/abandon')
  @RequirePermissions({ resource: 'checklists', action: 'update' })
  @ApiParam({ name: 'id', description: 'Response ID' })
  @ApiOperation({ summary: 'Abandon a response' })
  async abandon(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req: any,
  ) {
    return this.checklistsService.abandonResponse(id, reason, req.user.id);
  }

  @Get('pending/:contextType/:contextId')
  @RequirePermissions({ resource: 'checklists', action: 'read' })
  @ApiParam({ name: 'contextType', description: 'Context type (e.g., order, vehicle)' })
  @ApiParam({ name: 'contextId', description: 'Context ID' })
  @ApiOperation({ summary: 'Get pending checklists for a context' })
  async getPending(
    @Param('contextType') contextType: string,
    @Param('contextId') contextId: string,
  ) {
    return this.checklistsService.getPendingForContext(contextType, contextId);
  }

  @Post('check-complete')
  @RequirePermissions({ resource: 'checklists', action: 'read' })
  @ApiOperation({ summary: 'Check if required checklists are complete' })
  async checkComplete(
    @Body('contextType') contextType: string,
    @Body('contextId') contextId: string,
    @Body('templateCodes') templateCodes: string[],
  ) {
    return this.checklistsService.areRequiredChecklistsComplete(
      contextType,
      contextId,
      templateCodes,
    );
  }
}
