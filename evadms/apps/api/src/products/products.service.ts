import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateProductDto,
  UpdateProductDto,
  CreatePricingTierDto,
  UpdatePricingTierDto,
  SetTierPriceDto,
  SetCustomerPriceDto,
} from './dto/product.dto';

const VAT_RATE = 0.15;

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  // Products
  async findAllProducts(params: {
    page?: number;
    limit?: number;
    search?: string;
    productType?: string;
    isActive?: boolean;
  }) {
    const { page = 1, limit = 50, search, productType, isActive } = params;

    const where: any = {};

    if (search) {
      where.OR = [
        { sku: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (productType) {
      where.productType = productType;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          tierPrices: {
            include: { pricingTier: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findProductById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        tierPrices: {
          include: { pricingTier: true },
        },
        customerPrices: {
          where: {
            OR: [
              { validTo: null },
              { validTo: { gte: new Date() } },
            ],
          },
          include: { customer: { select: { id: true, accountNumber: true, companyName: true } } },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findProductBySku(sku: string) {
    return this.prisma.product.findUnique({
      where: { sku },
      include: {
        tierPrices: {
          include: { pricingTier: true },
        },
      },
    });
  }

  async createProduct(dto: CreateProductDto, createdById?: string) {
    const existing = await this.prisma.product.findUnique({
      where: { sku: dto.sku },
    });

    if (existing) {
      throw new ConflictException('Product with this SKU already exists');
    }

    const product = await this.prisma.product.create({
      data: {
        sku: dto.sku,
        name: dto.name,
        description: dto.description,
        productType: dto.productType as any,
        cylinderSizeKg: dto.cylinderSizeKg,
        unitPrice: dto.unitPrice,
        unitOfMeasure: dto.unitOfMeasure,
        vatApplicable: dto.vatApplicable ?? true,
        isActive: dto.isActive ?? true,
      },
    });

    await this.auditService.log({
      eventType: 'PRODUCT',
      eventSubtype: 'CREATE',
      action: 'CREATE',
      actorId: createdById,
      entityType: 'product',
      entityId: product.id,
      entityRef: product.sku,
      summary: `Product created: ${product.name}`,
      newState: {
        sku: product.sku,
        name: product.name,
        unitPrice: product.unitPrice,
      },
    });

    return product;
  }

  async updateProduct(id: string, dto: UpdateProductDto, updatedById?: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (dto.sku && dto.sku !== product.sku) {
      const existing = await this.prisma.product.findUnique({
        where: { sku: dto.sku },
      });
      if (existing) {
        throw new ConflictException('Product with this SKU already exists');
      }
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        ...dto,
        productType: dto.productType ? (dto.productType as any) : undefined,
      },
    });

    await this.auditService.log({
      eventType: 'PRODUCT',
      eventSubtype: 'UPDATE',
      action: 'UPDATE',
      actorId: updatedById,
      entityType: 'product',
      entityId: id,
      entityRef: updatedProduct.sku,
      summary: `Product updated: ${updatedProduct.name}`,
      previousState: {
        unitPrice: product.unitPrice,
        isActive: product.isActive,
      },
      newState: {
        unitPrice: updatedProduct.unitPrice,
        isActive: updatedProduct.isActive,
      },
    });

    return updatedProduct;
  }

  // Pricing Tiers
  async findAllPricingTiers() {
    return this.prisma.pricingTier.findMany({
      include: {
        tierPrices: {
          include: { product: true },
        },
        _count: {
          select: { customers: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findPricingTierById(id: string) {
    const tier = await this.prisma.pricingTier.findUnique({
      where: { id },
      include: {
        tierPrices: {
          include: { product: true },
        },
        customers: {
          select: { id: true, accountNumber: true, companyName: true },
        },
      },
    });

    if (!tier) {
      throw new NotFoundException('Pricing tier not found');
    }

    return tier;
  }

  async createPricingTier(dto: CreatePricingTierDto, createdById?: string) {
    // If this is default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.pricingTier.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const tier = await this.prisma.pricingTier.create({
      data: {
        name: dto.name,
        description: dto.description,
        discountPercentage: dto.discountPercentage,
        isDefault: dto.isDefault || false,
      },
    });

    await this.auditService.log({
      eventType: 'PRICING',
      eventSubtype: 'TIER_CREATE',
      action: 'CREATE',
      actorId: createdById,
      entityType: 'pricing_tier',
      entityId: tier.id,
      entityRef: tier.name,
      summary: `Pricing tier created: ${tier.name}`,
      newState: {
        name: tier.name,
        discountPercentage: tier.discountPercentage,
      },
    });

    return tier;
  }

  async updatePricingTier(id: string, dto: UpdatePricingTierDto, updatedById?: string) {
    const tier = await this.prisma.pricingTier.findUnique({ where: { id } });

    if (!tier) {
      throw new NotFoundException('Pricing tier not found');
    }

    if (dto.isDefault) {
      await this.prisma.pricingTier.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updatedTier = await this.prisma.pricingTier.update({
      where: { id },
      data: dto,
    });

    await this.auditService.log({
      eventType: 'PRICING',
      eventSubtype: 'TIER_UPDATE',
      action: 'UPDATE',
      actorId: updatedById,
      entityType: 'pricing_tier',
      entityId: id,
      entityRef: updatedTier.name,
      summary: `Pricing tier updated: ${updatedTier.name}`,
      previousState: {
        discountPercentage: tier.discountPercentage,
      },
      newState: {
        discountPercentage: updatedTier.discountPercentage,
      },
    });

    return updatedTier;
  }

  // Tier Prices
  async setTierPrice(dto: SetTierPriceDto, updatedById?: string) {
    const [product, tier] = await Promise.all([
      this.prisma.product.findUnique({ where: { id: dto.productId } }),
      this.prisma.pricingTier.findUnique({ where: { id: dto.pricingTierId } }),
    ]);

    if (!product) throw new NotFoundException('Product not found');
    if (!tier) throw new NotFoundException('Pricing tier not found');

    const tierPrice = await this.prisma.tierPrice.upsert({
      where: {
        pricingTierId_productId_minQuantity: {
          productId: dto.productId,
          pricingTierId: dto.pricingTierId,
          minQuantity: 1,
        },
      },
      update: { unitPrice: dto.price },
      create: {
        productId: dto.productId,
        pricingTierId: dto.pricingTierId,
        unitPrice: dto.price,
      },
    });

    await this.auditService.log({
      eventType: 'PRICING',
      eventSubtype: 'TIER_PRICE_SET',
      action: 'UPDATE',
      actorId: updatedById,
      entityType: 'tier_price',
      entityId: tierPrice.id,
      entityRef: `${product.sku}/${tier.name}`,
      summary: `Tier price set: ${product.name} @ ${tier.name} = R${dto.price}`,
      newState: {
        product: product.sku,
        tier: tier.name,
        price: dto.price,
      },
    });

    return tierPrice;
  }

  // Customer-specific Prices
  async setCustomerPrice(dto: SetCustomerPriceDto, updatedById?: string) {
    const [product, customer] = await Promise.all([
      this.prisma.product.findUnique({ where: { id: dto.productId } }),
      this.prisma.customer.findUnique({ where: { id: dto.customerId } }),
    ]);

    if (!product) throw new NotFoundException('Product not found');
    if (!customer) throw new NotFoundException('Customer not found');

    // Expire any existing active prices for this product/customer
    await this.prisma.customerPrice.updateMany({
      where: {
        productId: dto.productId,
        customerId: dto.customerId,
        OR: [
          { validTo: null },
          { validTo: { gte: new Date() } },
        ],
      },
      data: { validTo: new Date() },
    });

    const customerPrice = await this.prisma.customerPrice.create({
      data: {
        productId: dto.productId,
        customerId: dto.customerId,
        unitPrice: dto.price,
        validFrom: dto.validFrom || new Date(),
        validTo: dto.validTo,
      },
    });

    await this.auditService.log({
      eventType: 'PRICING',
      eventSubtype: 'CUSTOMER_PRICE_SET',
      action: 'CREATE',
      actorId: updatedById,
      entityType: 'customer_price',
      entityId: customerPrice.id,
      entityRef: `${product.sku}/${customer.accountNumber}`,
      summary: `Customer price set: ${product.name} for ${customer.companyName || customer.accountNumber} = R${dto.price}`,
      newState: {
        product: product.sku,
        customer: customer.accountNumber,
        price: dto.price,
      },
    });

    return customerPrice;
  }

  // Get effective price for a customer
  async getEffectivePrice(productId: string, customerId?: string, quantity = 1) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    let price = Number(product.unitPrice);
    let priceSource = 'base';
    let discountPercentage = 0;

    if (customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId },
        include: { pricingTier: true },
      });

      if (customer) {
        // Check for customer-specific price first
        const customerPrice = await this.prisma.customerPrice.findFirst({
          where: {
            productId,
            customerId,
            validFrom: { lte: new Date() },
            OR: [
              { validTo: null },
              { validTo: { gte: new Date() } },
            ],
          },
          orderBy: { validFrom: 'desc' },
        });

        if (customerPrice) {
          price = Number(customerPrice.unitPrice);
          priceSource = 'customer';
        } else if (customer.pricingTierId) {
          // Check for tier price
          const tierPrice = await this.prisma.tierPrice.findFirst({
            where: {
              productId,
              pricingTierId: customer.pricingTierId,
            },
            orderBy: { minQuantity: 'asc' },
          });

          if (tierPrice) {
            price = Number(tierPrice.unitPrice);
            priceSource = 'tier';
          } else if (customer.pricingTier) {
            // Apply tier discount to base price
            discountPercentage = Number(customer.pricingTier.discountPercentage);
            price = Number(product.unitPrice) * (1 - discountPercentage / 100);
            priceSource = 'tier_discount';
          }
        }

        // Apply customer-specific discount if any
        if (Number(customer.discountPercentage) > 0 && priceSource !== 'customer') {
          const additionalDiscount = Number(customer.discountPercentage);
          price = price * (1 - additionalDiscount / 100);
          discountPercentage += additionalDiscount;
        }
      }
    }

    const lineTotal = Math.round(price * quantity * 100) / 100;
    const vatAmount = product.vatApplicable
      ? Math.round(lineTotal * VAT_RATE * 100) / 100
      : 0;

    return {
      productId,
      productSku: product.sku,
      productName: product.name,
      basePrice: product.unitPrice,
      effectivePrice: Math.round(price * 100) / 100,
      priceSource,
      discountPercentage,
      quantity,
      lineTotal,
      vatApplicable: product.vatApplicable,
      vatAmount,
      totalWithVat: Math.round((lineTotal + vatAmount) * 100) / 100,
    };
  }

  // Get all cylinder products
  async getCylinderProducts() {
    return this.prisma.product.findMany({
      where: {
        productType: 'cylinder',
        isActive: true,
      },
      orderBy: { cylinderSizeKg: 'asc' },
    });
  }

  // Get bulk LPG product
  async getBulkLPGProduct() {
    return this.prisma.product.findFirst({
      where: {
        productType: 'bulk_lpg',
        isActive: true,
      },
    });
  }
}
