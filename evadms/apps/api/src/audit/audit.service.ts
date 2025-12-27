import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

export interface AuditLogEntry {
  eventType: string;
  eventSubtype?: string;
  action: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  entityType: string;
  entityId?: string;
  entityRef?: string;
  summary: string;
  details?: Record<string, any>;
  previousState?: Record<string, any>;
  newState?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  sessionId?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      // Get the previous event for hash chain
      const previousEvent = await this.prisma.auditEventLog.findFirst({
        orderBy: { sequenceNumber: 'desc' },
        select: { recordHash: true },
      });

      // Create the record hash
      const dataToHash = JSON.stringify({
        ...entry,
        previousHash: previousEvent?.recordHash,
        timestamp: new Date().toISOString(),
      });
      const recordHash = crypto.createHash('sha256').update(dataToHash).digest('hex');

      await this.prisma.auditEventLog.create({
        data: {
          eventType: entry.eventType,
          eventSubtype: entry.eventSubtype,
          action: entry.action,
          actorId: entry.actorId,
          actorEmail: entry.actorEmail,
          actorRole: entry.actorRole,
          entityType: entry.entityType,
          entityId: entry.entityId,
          entityRef: entry.entityRef,
          summary: entry.summary,
          details: entry.details,
          previousState: entry.previousState,
          newState: entry.newState,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          deviceId: entry.deviceId,
          sessionId: entry.sessionId,
          gpsLatitude: entry.gpsLatitude,
          gpsLongitude: entry.gpsLongitude,
          previousHash: previousEvent?.recordHash,
          recordHash,
          occurredAt: new Date(),
        },
      });
    } catch (error) {
      // Don't throw - audit logging should not break the main flow
      console.error('Failed to create audit log entry:', error);
    }
  }

  async getEvents(params: {
    eventType?: string;
    entityType?: string;
    entityId?: string;
    actorId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const {
      eventType,
      entityType,
      entityId,
      actorId,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = params;

    const where: any = {};

    if (eventType) where.eventType = eventType;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (actorId) where.actorId = actorId;

    if (startDate || endDate) {
      where.occurredAt = {};
      if (startDate) where.occurredAt.gte = startDate;
      if (endDate) where.occurredAt.lte = endDate;
    }

    const [events, total] = await Promise.all([
      this.prisma.auditEventLog.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditEventLog.count({ where }),
    ]);

    return {
      data: events,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEntityHistory(entityType: string, entityId: string) {
    return this.prisma.auditEventLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { occurredAt: 'desc' },
    });
  }

  async verifyChainIntegrity(startSequence?: bigint, endSequence?: bigint): Promise<{
    valid: boolean;
    brokenAt?: bigint;
  }> {
    const where: any = {};
    if (startSequence !== undefined) where.sequenceNumber = { gte: startSequence };
    if (endSequence !== undefined) {
      where.sequenceNumber = { ...where.sequenceNumber, lte: endSequence };
    }

    const events = await this.prisma.auditEventLog.findMany({
      where,
      orderBy: { sequenceNumber: 'asc' },
      select: {
        sequenceNumber: true,
        previousHash: true,
        recordHash: true,
      },
    });

    for (let i = 1; i < events.length; i++) {
      if (events[i].previousHash !== events[i - 1].recordHash) {
        return {
          valid: false,
          brokenAt: events[i].sequenceNumber,
        };
      }
    }

    return { valid: true };
  }
}
