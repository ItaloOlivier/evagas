import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    role?: string;
  }) {
    const { page = 1, limit = 20, search, status, role } = params;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (role) {
      where.roles = {
        some: {
          role: {
            name: role,
          },
        },
      };
    }

    try {
      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count({ where }),
      ]);

      return {
        data: users.map((user) => this.sanitizeUser(user)),
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('UsersService.findAll error:', error);
      throw error;
    }
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        driver: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async create(dto: CreateUserDto, createdById?: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        status: (dto.status || 'active') as any,
        createdById,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Assign roles if provided
    if (dto.roleIds && dto.roleIds.length > 0) {
      await this.assignRoles(user.id, dto.roleIds, createdById);
    }

    await this.auditService.log({
      eventType: 'USER',
      eventSubtype: 'CREATE',
      action: 'CREATE',
      actorId: createdById,
      entityType: 'user',
      entityId: user.id,
      summary: `User created: ${user.email}`,
      newState: { email: user.email, firstName: user.firstName, lastName: user.lastName },
    });

    return this.sanitizeUser(user);
  }

  async update(id: string, dto: UpdateUserDto, updatedById?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData: any = {};

    if (dto.email) updateData.email = dto.email.toLowerCase();
    if (dto.firstName) updateData.firstName = dto.firstName;
    if (dto.lastName) updateData.lastName = dto.lastName;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.status) updateData.status = dto.status;
    if (dto.password) {
      updateData.passwordHash = await bcrypt.hash(dto.password, 12);
      updateData.passwordChangedAt = new Date();
    }

    updateData.updatedById = updatedById;

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    await this.auditService.log({
      eventType: 'USER',
      eventSubtype: 'UPDATE',
      action: 'UPDATE',
      actorId: updatedById,
      entityType: 'user',
      entityId: id,
      summary: `User updated: ${updatedUser.email}`,
      previousState: { email: user.email, firstName: user.firstName, lastName: user.lastName },
      newState: { email: updatedUser.email, firstName: updatedUser.firstName, lastName: updatedUser.lastName },
    });

    return this.sanitizeUser(updatedUser);
  }

  async delete(id: string, deletedById?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete by setting status to inactive
    await this.prisma.user.update({
      where: { id },
      data: {
        status: 'inactive',
        updatedById: deletedById,
      },
    });

    await this.auditService.log({
      eventType: 'USER',
      eventSubtype: 'DELETE',
      action: 'DELETE',
      actorId: deletedById,
      entityType: 'user',
      entityId: id,
      summary: `User deactivated: ${user.email}`,
    });

    return { message: 'User deactivated successfully' };
  }

  async assignRoles(userId: string, roleIds: string[], assignedBy?: string) {
    // Remove existing roles
    await this.prisma.userRole.deleteMany({
      where: { userId },
    });

    // Assign new roles
    await this.prisma.userRole.createMany({
      data: roleIds.map((roleId) => ({
        userId,
        roleId,
        assignedBy,
      })),
    });

    await this.auditService.log({
      eventType: 'USER',
      eventSubtype: 'ROLE_ASSIGN',
      action: 'UPDATE',
      actorId: assignedBy,
      entityType: 'user',
      entityId: userId,
      summary: `Roles assigned to user`,
      newState: { roleIds },
    });
  }

  async removeRole(userId: string, roleId: string, removedBy?: string) {
    await this.prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    await this.auditService.log({
      eventType: 'USER',
      eventSubtype: 'ROLE_REMOVE',
      action: 'UPDATE',
      actorId: removedBy,
      entityType: 'user',
      entityId: userId,
      summary: `Role removed from user`,
      details: { roleId },
    });
  }

  async getRoles() {
    return this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: { displayName: 'asc' },
    });
  }

  private sanitizeUser(user: any) {
    if (!user) return null;
    const { passwordHash, ...sanitized } = user;
    return {
      ...sanitized,
      roles: user.roles?.map((r: any) => r.role) || [],
      // Flatten role name for frontend compatibility
      role: user.roles?.[0]?.role?.name || 'user',
    };
  }
}
