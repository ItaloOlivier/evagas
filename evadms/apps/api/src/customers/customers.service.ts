import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateCustomerDto, UpdateCustomerDto, CreateSiteDto, UpdateSiteDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    customerType?: string;
    status?: string;
  }) {
    const { page = 1, limit = 20, search, customerType, status } = params;

    const where: any = {};

    if (search) {
      where.OR = [
        { accountNumber: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { primaryContactName: { contains: search, mode: 'insensitive' } },
        { primaryEmail: { contains: search, mode: 'insensitive' } },
        { primaryPhone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (customerType) {
      where.customerType = customerType;
    }

    if (status) {
      where.status = status;
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        include: {
          sites: {
            where: { status: 'active' },
          },
          pricingTier: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data: customers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        sites: true,
        contacts: true,
        pricingTier: true,
        quotes: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async findByAccountNumber(accountNumber: string) {
    return this.prisma.customer.findUnique({
      where: { accountNumber },
      include: {
        sites: { where: { status: 'active' } },
      },
    });
  }

  async create(dto: CreateCustomerDto, createdById?: string) {
    // Generate account number
    const lastCustomer = await this.prisma.customer.findFirst({
      orderBy: { accountNumber: 'desc' },
      select: { accountNumber: true },
    });

    let nextNumber = 1;
    if (lastCustomer?.accountNumber) {
      const match = lastCustomer.accountNumber.match(/EVA-C-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    const accountNumber = `EVA-C-${nextNumber.toString().padStart(5, '0')}`;

    const customer = await this.prisma.customer.create({
      data: {
        accountNumber,
        companyName: dto.companyName,
        customerType: dto.customerType,
        primaryContactName: dto.primaryContactName,
        primaryPhone: dto.primaryPhone,
        primaryEmail: dto.primaryEmail?.toLowerCase(),
        vatNumber: dto.vatNumber,
        registrationNumber: dto.registrationNumber,
        pricingTierId: dto.pricingTierId,
        discountPercentage: dto.discountPercentage || 0,
        creditLimit: dto.creditLimit || 0,
        paymentTermsDays: dto.paymentTermsDays || 0,
        commEmail: dto.commEmail ?? true,
        commSms: dto.commSms ?? true,
        commWhatsapp: dto.commWhatsapp ?? true,
        preferredContactMethod: dto.preferredContactMethod || 'phone',
        status: dto.status || 'active',
        notes: dto.notes,
        createdById,
      },
      include: {
        sites: true,
        pricingTier: true,
      },
    });

    // Create primary site if provided
    if (dto.primarySite) {
      await this.createSite(customer.id, {
        ...dto.primarySite,
        isPrimary: true,
      });
    }

    await this.auditService.log({
      eventType: 'CUSTOMER',
      eventSubtype: 'CREATE',
      action: 'CREATE',
      actorId: createdById,
      entityType: 'customer',
      entityId: customer.id,
      entityRef: customer.accountNumber,
      summary: `Customer created: ${customer.companyName || customer.primaryContactName}`,
      newState: {
        accountNumber: customer.accountNumber,
        customerType: customer.customerType,
        name: customer.companyName || customer.primaryContactName,
      },
    });

    return this.findById(customer.id);
  }

  async update(id: string, dto: UpdateCustomerDto, updatedById?: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const updatedCustomer = await this.prisma.customer.update({
      where: { id },
      data: {
        companyName: dto.companyName,
        customerType: dto.customerType,
        primaryContactName: dto.primaryContactName,
        primaryPhone: dto.primaryPhone,
        primaryEmail: dto.primaryEmail?.toLowerCase(),
        vatNumber: dto.vatNumber,
        registrationNumber: dto.registrationNumber,
        pricingTierId: dto.pricingTierId,
        discountPercentage: dto.discountPercentage,
        creditLimit: dto.creditLimit,
        paymentTermsDays: dto.paymentTermsDays,
        commEmail: dto.commEmail,
        commSms: dto.commSms,
        commWhatsapp: dto.commWhatsapp,
        preferredContactMethod: dto.preferredContactMethod,
        status: dto.status,
        notes: dto.notes,
        updatedById,
      },
      include: {
        sites: true,
        pricingTier: true,
      },
    });

    await this.auditService.log({
      eventType: 'CUSTOMER',
      eventSubtype: 'UPDATE',
      action: 'UPDATE',
      actorId: updatedById,
      entityType: 'customer',
      entityId: id,
      entityRef: customer.accountNumber,
      summary: `Customer updated: ${updatedCustomer.companyName || updatedCustomer.primaryContactName}`,
      previousState: {
        name: customer.companyName || customer.primaryContactName,
        status: customer.status,
      },
      newState: {
        name: updatedCustomer.companyName || updatedCustomer.primaryContactName,
        status: updatedCustomer.status,
      },
    });

    return updatedCustomer;
  }

  async delete(id: string, deletedById?: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Soft delete
    await this.prisma.customer.update({
      where: { id },
      data: {
        status: 'inactive',
        updatedById: deletedById,
      },
    });

    await this.auditService.log({
      eventType: 'CUSTOMER',
      eventSubtype: 'DELETE',
      action: 'DELETE',
      actorId: deletedById,
      entityType: 'customer',
      entityId: id,
      entityRef: customer.accountNumber,
      summary: `Customer deactivated: ${customer.companyName || customer.primaryContactName}`,
    });

    return { message: 'Customer deactivated successfully' };
  }

  // Sites
  async createSite(customerId: string, dto: CreateSiteDto) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // If this is set as primary, unset other primary sites
    if (dto.isPrimary) {
      await this.prisma.customerSite.updateMany({
        where: { customerId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const site = await this.prisma.customerSite.create({
      data: {
        customerId,
        siteName: dto.siteName,
        isPrimary: dto.isPrimary || false,
        streetAddress: dto.streetAddress,
        suburb: dto.suburb,
        city: dto.city,
        province: dto.province,
        postalCode: dto.postalCode,
        latitude: dto.latitude,
        longitude: dto.longitude,
        deliveryInstructions: dto.deliveryInstructions,
        accessRequirements: dto.accessRequirements,
        preferredDeliveryWindow: dto.preferredDeliveryWindow,
        siteContactName: dto.siteContactName,
        siteContactPhone: dto.siteContactPhone,
        status: 'active',
      },
    });

    return site;
  }

  async updateSite(customerId: string, siteId: string, dto: UpdateSiteDto) {
    const site = await this.prisma.customerSite.findFirst({
      where: { id: siteId, customerId },
    });

    if (!site) {
      throw new NotFoundException('Site not found');
    }

    if (dto.isPrimary) {
      await this.prisma.customerSite.updateMany({
        where: { customerId, isPrimary: true, id: { not: siteId } },
        data: { isPrimary: false },
      });
    }

    return this.prisma.customerSite.update({
      where: { id: siteId },
      data: dto,
    });
  }

  async deleteSite(customerId: string, siteId: string) {
    const site = await this.prisma.customerSite.findFirst({
      where: { id: siteId, customerId },
    });

    if (!site) {
      throw new NotFoundException('Site not found');
    }

    await this.prisma.customerSite.update({
      where: { id: siteId },
      data: { status: 'inactive' },
    });

    return { message: 'Site deactivated successfully' };
  }

  async getSites(customerId: string) {
    return this.prisma.customerSite.findMany({
      where: { customerId, status: 'active' },
      orderBy: [{ isPrimary: 'desc' }, { siteName: 'asc' }],
    });
  }
}
