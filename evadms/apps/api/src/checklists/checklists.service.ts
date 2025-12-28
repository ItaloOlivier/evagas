import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateChecklistTemplateDto,
  UpdateChecklistTemplateDto,
  CreateChecklistItemDto,
  UpdateChecklistItemDto,
  StartChecklistResponseDto,
  SubmitAnswersDto,
  CompleteChecklistDto,
  ChecklistType,
} from './dto/checklist.dto';

@Injectable()
export class ChecklistsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  // ============= TEMPLATES =============

  async findAllTemplates(params: { templateType?: ChecklistType; status?: string }) {
    const { templateType, status } = params;

    const where: any = {};
    if (templateType) where.templateType = templateType;
    if (status) where.status = status;

    return this.prisma.checklistTemplate.findMany({
      where,
      include: {
        items: {
          orderBy: { sequenceNumber: 'asc' },
        },
        _count: {
          select: { responses: true },
        },
      },
      orderBy: [{ templateType: 'asc' }, { name: 'asc' }],
    });
  }

  async findTemplateById(id: string) {
    const template = await this.prisma.checklistTemplate.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { sequenceNumber: 'asc' },
        },
        createdBy: { select: { firstName: true, lastName: true } },
        approvedBy: { select: { firstName: true, lastName: true } },
      },
    });

    if (!template) {
      throw new NotFoundException('Checklist template not found');
    }

    return template;
  }

  async findTemplateByCode(code: string) {
    const template = await this.prisma.checklistTemplate.findUnique({
      where: { code },
      include: {
        items: {
          orderBy: { sequenceNumber: 'asc' },
        },
      },
    });

    if (!template) {
      throw new NotFoundException('Checklist template not found');
    }

    return template;
  }

  async createTemplate(dto: CreateChecklistTemplateDto, createdById: string) {
    const existing = await this.prisma.checklistTemplate.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException('Template with this code already exists');
    }

    const template = await this.prisma.checklistTemplate.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        templateType: dto.templateType,
        isMandatory: dto.isMandatory ?? true,
        blocksOnFailure: dto.blocksOnFailure ?? false,
        version: 1,
        status: 'draft',
        createdById,
        items: dto.items
          ? {
              create: dto.items.map((item) => ({
                sequenceNumber: item.sequenceNumber,
                questionText: item.questionText,
                helpText: item.helpText,
                itemType: item.itemType,
                options: item.options,
                isMandatory: item.isMandatory ?? true,
                isCritical: item.isCritical ?? false,
                conditionalOnItemId: item.conditionalOnItemId,
                conditionalValue: item.conditionalValue,
                expectedRangeMin: item.expectedRangeMin,
                expectedRangeMax: item.expectedRangeMax,
                unitOfMeasure: item.unitOfMeasure,
              })),
            }
          : undefined,
      },
      include: {
        items: {
          orderBy: { sequenceNumber: 'asc' },
        },
      },
    });

    await this.auditService.log({
      eventType: 'CHECKLIST',
      eventSubtype: 'TEMPLATE_CREATE',
      action: 'CREATE',
      actorId: createdById,
      entityType: 'checklist_template',
      entityId: template.id,
      entityRef: template.code,
      summary: `Checklist template created: ${template.name}`,
    });

    return template;
  }

  async updateTemplate(id: string, dto: UpdateChecklistTemplateDto, updatedById: string) {
    const template = await this.prisma.checklistTemplate.findUnique({ where: { id } });

    if (!template) {
      throw new NotFoundException('Checklist template not found');
    }

    if (template.status === 'active') {
      throw new BadRequestException('Cannot update an active template. Create a new version instead.');
    }

    const updatedTemplate = await this.prisma.checklistTemplate.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        isMandatory: dto.isMandatory,
        blocksOnFailure: dto.blocksOnFailure,
        updatedAt: new Date(),
      },
      include: {
        items: {
          orderBy: { sequenceNumber: 'asc' },
        },
      },
    });

    await this.auditService.log({
      eventType: 'CHECKLIST',
      eventSubtype: 'TEMPLATE_UPDATE',
      action: 'UPDATE',
      actorId: updatedById,
      entityType: 'checklist_template',
      entityId: id,
      entityRef: template.code,
      summary: `Checklist template updated: ${updatedTemplate.name}`,
    });

    return updatedTemplate;
  }

  async addItem(templateId: string, dto: CreateChecklistItemDto, createdById: string) {
    const template = await this.prisma.checklistTemplate.findUnique({ where: { id: templateId } });

    if (!template) {
      throw new NotFoundException('Checklist template not found');
    }

    if (template.status === 'active') {
      throw new BadRequestException('Cannot add items to an active template');
    }

    const item = await this.prisma.checklistItem.create({
      data: {
        templateId,
        sequenceNumber: dto.sequenceNumber,
        questionText: dto.questionText,
        helpText: dto.helpText,
        itemType: dto.itemType,
        options: dto.options,
        isMandatory: dto.isMandatory ?? true,
        isCritical: dto.isCritical ?? false,
        conditionalOnItemId: dto.conditionalOnItemId,
        conditionalValue: dto.conditionalValue,
        expectedRangeMin: dto.expectedRangeMin,
        expectedRangeMax: dto.expectedRangeMax,
        unitOfMeasure: dto.unitOfMeasure,
      },
    });

    return item;
  }

  async updateItem(templateId: string, itemId: string, dto: UpdateChecklistItemDto, updatedById: string) {
    const item = await this.prisma.checklistItem.findFirst({
      where: { id: itemId, templateId },
      include: { template: true },
    });

    if (!item) {
      throw new NotFoundException('Checklist item not found');
    }

    if (item.template.status === 'active') {
      throw new BadRequestException('Cannot update items in an active template');
    }

    return this.prisma.checklistItem.update({
      where: { id: itemId },
      data: dto,
    });
  }

  async removeItem(templateId: string, itemId: string, removedById: string) {
    const item = await this.prisma.checklistItem.findFirst({
      where: { id: itemId, templateId },
      include: { template: true },
    });

    if (!item) {
      throw new NotFoundException('Checklist item not found');
    }

    if (item.template.status === 'active') {
      throw new BadRequestException('Cannot remove items from an active template');
    }

    await this.prisma.checklistItem.delete({ where: { id: itemId } });

    return { message: 'Item removed successfully' };
  }

  async activateTemplate(id: string, approvedById: string) {
    const template = await this.prisma.checklistTemplate.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!template) {
      throw new NotFoundException('Checklist template not found');
    }

    if (template.status === 'active') {
      throw new BadRequestException('Template is already active');
    }

    if (template.items.length === 0) {
      throw new BadRequestException('Cannot activate a template with no items');
    }

    // Archive any existing active template with the same code
    await this.prisma.checklistTemplate.updateMany({
      where: { code: template.code, status: 'active', id: { not: id } },
      data: { status: 'archived' },
    });

    const updatedTemplate = await this.prisma.checklistTemplate.update({
      where: { id },
      data: {
        status: 'active',
        approvedById: approvedById,
        approvedAt: new Date(),
      },
    });

    await this.auditService.log({
      eventType: 'CHECKLIST',
      eventSubtype: 'TEMPLATE_ACTIVATE',
      action: 'UPDATE',
      actorId: approvedById,
      entityType: 'checklist_template',
      entityId: id,
      entityRef: template.code,
      summary: `Checklist template activated: ${template.name} v${template.version}`,
    });

    return updatedTemplate;
  }

  async archiveTemplate(id: string, archivedById: string) {
    const template = await this.prisma.checklistTemplate.findUnique({ where: { id } });

    if (!template) {
      throw new NotFoundException('Checklist template not found');
    }

    const updatedTemplate = await this.prisma.checklistTemplate.update({
      where: { id },
      data: {
        status: 'archived',
      },
    });

    await this.auditService.log({
      eventType: 'CHECKLIST',
      eventSubtype: 'TEMPLATE_ARCHIVE',
      action: 'UPDATE',
      actorId: archivedById,
      entityType: 'checklist_template',
      entityId: id,
      entityRef: template.code,
      summary: `Checklist template archived: ${template.name}`,
    });

    return updatedTemplate;
  }

  async createNewVersion(id: string, createdById: string) {
    const template = await this.prisma.checklistTemplate.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!template) {
      throw new NotFoundException('Checklist template not found');
    }

    const newTemplate = await this.prisma.checklistTemplate.create({
      data: {
        code: template.code,
        name: template.name,
        description: template.description,
        templateType: template.templateType,
        isMandatory: template.isMandatory,
        blocksOnFailure: template.blocksOnFailure,
        version: template.version + 1,
        status: 'draft',
        createdById,
        items: {
          create: template.items.map((item) => ({
            sequenceNumber: item.sequenceNumber,
            questionText: item.questionText,
            helpText: item.helpText,
            itemType: item.itemType,
            options: item.options as string[] | undefined,
            isMandatory: item.isMandatory,
            isCritical: item.isCritical,
            conditionalValue: item.conditionalValue,
            expectedRangeMin: item.expectedRangeMin,
            expectedRangeMax: item.expectedRangeMax,
            unitOfMeasure: item.unitOfMeasure,
          })),
        },
      },
      include: {
        items: {
          orderBy: { sequenceNumber: 'asc' },
        },
      },
    });

    await this.auditService.log({
      eventType: 'CHECKLIST',
      eventSubtype: 'TEMPLATE_VERSION',
      action: 'CREATE',
      actorId: createdById,
      entityType: 'checklist_template',
      entityId: newTemplate.id,
      entityRef: `${newTemplate.code} v${newTemplate.version}`,
      summary: `New version created: ${newTemplate.name} v${newTemplate.version}`,
    });

    return newTemplate;
  }

  // ============= RESPONSES =============

  async findAllResponses(params: {
    page?: number;
    limit?: number;
    templateId?: string;
    contextType?: string;
    contextId?: string;
    status?: string;
    passed?: boolean;
  }) {
    const { page = 1, limit = 20, templateId, contextType, contextId, status, passed } = params;

    const where: any = {};
    if (templateId) where.templateId = templateId;
    if (contextType) where.contextType = contextType;
    if (contextId) where.contextId = contextId;
    if (status) where.status = status;
    if (passed !== undefined) where.passed = passed;

    const [responses, total] = await Promise.all([
      this.prisma.checklistResponse.findMany({
        where,
        include: {
          template: { select: { code: true, name: true } },
          completedBy: { select: { firstName: true, lastName: true } },
          _count: { select: { items: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.checklistResponse.count({ where }),
    ]);

    return {
      data: responses,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findResponseById(id: string) {
    const response = await this.prisma.checklistResponse.findUnique({
      where: { id },
      include: {
        template: {
          include: {
            items: { orderBy: { sequenceNumber: 'asc' } },
          },
        },
        items: {
          include: {
            item: true,
            answeredBy: { select: { firstName: true, lastName: true } },
          },
          orderBy: { item: { sequenceNumber: 'asc' } },
        },
        completedBy: { select: { firstName: true, lastName: true } },
      },
    });

    if (!response) {
      throw new NotFoundException('Checklist response not found');
    }

    return response;
  }

  async startResponse(dto: StartChecklistResponseDto, startedById: string) {
    const template = await this.prisma.checklistTemplate.findUnique({
      where: { id: dto.templateId },
      include: { items: true },
    });

    if (!template) {
      throw new NotFoundException('Checklist template not found');
    }

    if (template.status !== 'active') {
      throw new BadRequestException('Can only start responses for active templates');
    }

    // Generate response reference
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const lastResponse = await this.prisma.checklistResponse.findFirst({
      where: { responseRef: { startsWith: `CHK-${dateStr}` } },
      orderBy: { responseRef: 'desc' },
      select: { responseRef: true },
    });

    let nextNumber = 1;
    if (lastResponse?.responseRef) {
      const match = lastResponse.responseRef.match(/CHK-\d+-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    const responseRef = `CHK-${dateStr}-${nextNumber.toString().padStart(4, '0')}`;

    const response = await this.prisma.checklistResponse.create({
      data: {
        responseRef,
        templateId: dto.templateId,
        templateVersion: template.version,
        contextType: dto.contextType,
        contextId: dto.contextId,
        startedAt: new Date(),
        status: 'in_progress',
        failedCriticalCount: 0,
        failedNonCriticalCount: 0,
        gpsLatitude: dto.gpsLatitude,
        gpsLongitude: dto.gpsLongitude,
        completedById: startedById,
      },
      include: {
        template: {
          include: {
            items: { orderBy: { sequenceNumber: 'asc' } },
          },
        },
      },
    });

    await this.auditService.log({
      eventType: 'CHECKLIST',
      eventSubtype: 'RESPONSE_START',
      action: 'CREATE',
      actorId: startedById,
      entityType: 'checklist_response',
      entityId: response.id,
      entityRef: response.responseRef,
      summary: `Checklist started: ${template.name} for ${dto.contextType}`,
    });

    return response;
  }

  async submitAnswers(responseId: string, dto: SubmitAnswersDto, answeredById: string) {
    const response = await this.prisma.checklistResponse.findUnique({
      where: { id: responseId },
      include: {
        template: {
          include: { items: true },
        },
      },
    });

    if (!response) {
      throw new NotFoundException('Checklist response not found');
    }

    if (response.status !== 'in_progress') {
      throw new BadRequestException('Can only submit answers for in-progress responses');
    }

    const itemsMap = new Map(response.template.items.map((i) => [i.id, i]));
    let failedCriticalCount = 0;
    let failedNonCriticalCount = 0;

    for (const answer of dto.answers) {
      const item = itemsMap.get(answer.itemId) as any;
      if (!item) continue;

      // Determine if answer passed
      let passed = true;
      let isInRange = true;

      if (item.itemType === 'yes_no' || item.itemType === 'yes_no_na') {
        passed = answer.answerValue === 'Yes' || answer.answerValue === 'N/A';
      }

      if (item.itemType === 'number' || item.itemType === 'reading') {
        if (answer.numericValue !== undefined) {
          if (item.expectedRangeMin !== null && answer.numericValue < item.expectedRangeMin) {
            isInRange = false;
            passed = false;
          }
          if (item.expectedRangeMax !== null && answer.numericValue > item.expectedRangeMax) {
            isInRange = false;
            passed = false;
          }
        }
      }

      if (!passed) {
        if (item.isCritical) {
          failedCriticalCount++;
        } else {
          failedNonCriticalCount++;
        }
      }

      await this.prisma.checklistResponseItem.upsert({
        where: {
          responseId_itemId: {
            responseId,
            itemId: answer.itemId,
          },
        },
        update: {
          answerValue: answer.answerValue,
          answerPassed: passed,
          numericValue: answer.numericValue,
          isInRange,
          attachmentId: answer.attachmentId,
          issueNotes: answer.issueNotes,
          answeredAt: new Date(),
          answeredById: answeredById,
        },
        create: {
          responseId,
          itemId: answer.itemId,
          answerValue: answer.answerValue,
          answerPassed: passed,
          numericValue: answer.numericValue,
          isInRange,
          attachmentId: answer.attachmentId,
          issueNotes: answer.issueNotes,
          answeredAt: new Date(),
          answeredById: answeredById,
        },
      });
    }

    // Update response counts
    const updatedResponse = await this.prisma.checklistResponse.update({
      where: { id: responseId },
      data: {
        failedCriticalCount: { increment: failedCriticalCount },
        failedNonCriticalCount: { increment: failedNonCriticalCount },
        gpsLatitude: dto.gpsLatitude || response.gpsLatitude,
        gpsLongitude: dto.gpsLongitude || response.gpsLongitude,
      },
      include: {
        items: {
          include: { item: true },
          orderBy: { item: { sequenceNumber: 'asc' } },
        },
      },
    });

    return updatedResponse;
  }

  async completeResponse(responseId: string, dto: CompleteChecklistDto, completedById: string) {
    const response = await this.prisma.checklistResponse.findUnique({
      where: { id: responseId },
      include: {
        template: {
          include: { items: true },
        },
        items: true,
      },
    });

    if (!response) {
      throw new NotFoundException('Checklist response not found');
    }

    if (response.status !== 'in_progress') {
      throw new BadRequestException('Can only complete in-progress responses');
    }

    // Check if all mandatory items are answered
    const mandatoryItems = response.template.items.filter((i) => i.isMandatory);
    const answeredItemIds = new Set(response.items.map((i) => i.itemId));
    const missingMandatory = mandatoryItems.filter((i) => !answeredItemIds.has(i.id));

    if (missingMandatory.length > 0) {
      throw new BadRequestException(
        `Missing answers for mandatory items: ${missingMandatory.map((i) => i.questionText).join(', ')}`,
      );
    }

    // Determine if passed (no critical failures)
    const passed = response.failedCriticalCount === 0;
    const status = passed ? 'completed' : 'failed';

    const updatedResponse = await this.prisma.checklistResponse.update({
      where: { id: responseId },
      data: {
        status,
        passed,
        completedAt: new Date(),
        completedById: completedById,
        notes: dto.notes,
        gpsLatitude: dto.gpsLatitude || response.gpsLatitude,
        gpsLongitude: dto.gpsLongitude || response.gpsLongitude,
      },
      include: {
        template: { select: { code: true, name: true, blocksOnFailure: true } },
        items: {
          include: { item: true },
        },
      },
    });

    await this.auditService.log({
      eventType: 'CHECKLIST',
      eventSubtype: passed ? 'RESPONSE_PASS' : 'RESPONSE_FAIL',
      action: 'UPDATE',
      actorId: completedById,
      entityType: 'checklist_response',
      entityId: responseId,
      entityRef: response.responseRef,
      summary: `Checklist ${passed ? 'passed' : 'failed'}: ${response.template.name}`,
      newState: {
        passed,
        failedCritical: response.failedCriticalCount,
        failedNonCritical: response.failedNonCriticalCount,
      },
    });

    // Return blocking information if failed and template blocks on failure
    if (!passed && updatedResponse.template.blocksOnFailure) {
      return {
        ...updatedResponse,
        blocking: true,
        blockingMessage: `Checklist failed with ${response.failedCriticalCount} critical failures. Workflow blocked.`,
      };
    }

    return updatedResponse;
  }

  async abandonResponse(responseId: string, reason: string, abandonedById: string) {
    const response = await this.prisma.checklistResponse.findUnique({
      where: { id: responseId },
      include: { template: true },
    });

    if (!response) {
      throw new NotFoundException('Checklist response not found');
    }

    if (response.status !== 'in_progress') {
      throw new BadRequestException('Can only abandon in-progress responses');
    }

    const updatedResponse = await this.prisma.checklistResponse.update({
      where: { id: responseId },
      data: {
        status: 'abandoned',
        notes: `Abandoned: ${reason}`,
        completedAt: new Date(),
        completedBy: abandonedById,
      },
    });

    await this.auditService.log({
      eventType: 'CHECKLIST',
      eventSubtype: 'RESPONSE_ABANDON',
      action: 'UPDATE',
      actorId: abandonedById,
      entityType: 'checklist_response',
      entityId: responseId,
      entityRef: response.responseRef,
      summary: `Checklist abandoned: ${response.template.name} - ${reason}`,
    });

    return updatedResponse;
  }

  // Get pending checklists for a context
  async getPendingForContext(contextType: string, contextId: string) {
    return this.prisma.checklistResponse.findMany({
      where: {
        contextType,
        contextId,
        status: 'in_progress',
      },
      include: {
        template: { select: { code: true, name: true } },
      },
    });
  }

  // Check if all required checklists are complete for a context
  async areRequiredChecklistsComplete(contextType: string, contextId: string, templateCodes: string[]) {
    const completedResponses = await this.prisma.checklistResponse.findMany({
      where: {
        contextType,
        contextId,
        status: 'completed',
        passed: true,
        template: { code: { in: templateCodes } },
      },
      include: {
        template: { select: { code: true } },
      },
    });

    const completedCodes = new Set(completedResponses.map((r) => r.template.code));
    const missingCodes = templateCodes.filter((code) => !completedCodes.has(code));

    return {
      complete: missingCodes.length === 0,
      completedCodes: Array.from(completedCodes),
      missingCodes,
    };
  }
}
