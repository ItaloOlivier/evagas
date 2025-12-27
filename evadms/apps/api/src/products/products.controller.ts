import {
  Controller,
  Get,
  Post,
  Put,
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
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  CreatePricingTierDto,
  UpdatePricingTierDto,
  SetTierPriceDto,
  SetCustomerPriceDto,
  GetPriceDto,
} from './dto/product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @RequirePermissions({ resource: 'products', action: 'read' })
  @ApiOperation({ summary: 'Get all products with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated products list' })
  async findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAllProducts(query);
  }

  @Get('cylinders')
  @RequirePermissions({ resource: 'products', action: 'read' })
  @ApiOperation({ summary: 'Get all cylinder products' })
  @ApiResponse({ status: 200, description: 'Returns cylinder products' })
  async getCylinders() {
    return this.productsService.getCylinderProducts();
  }

  @Get('bulk-lpg')
  @RequirePermissions({ resource: 'products', action: 'read' })
  @ApiOperation({ summary: 'Get bulk LPG product' })
  @ApiResponse({ status: 200, description: 'Returns bulk LPG product' })
  async getBulkLPG() {
    return this.productsService.getBulkLPGProduct();
  }

  @Get(':id')
  @RequirePermissions({ resource: 'products', action: 'read' })
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Returns product details' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findById(@Param('id') id: string) {
    return this.productsService.findProductById(id);
  }

  @Get('sku/:sku')
  @RequirePermissions({ resource: 'products', action: 'read' })
  @ApiOperation({ summary: 'Get product by SKU' })
  @ApiParam({ name: 'sku', description: 'Product SKU' })
  @ApiResponse({ status: 200, description: 'Returns product details' })
  async findBySku(@Param('sku') sku: string) {
    return this.productsService.findProductBySku(sku);
  }

  @Post()
  @RequirePermissions({ resource: 'products', action: 'create' })
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'SKU already exists' })
  async create(@Body() dto: CreateProductDto, @Request() req: any) {
    return this.productsService.createProduct(dto, req.user?.id);
  }

  @Put(':id')
  @RequirePermissions({ resource: 'products', action: 'update' })
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @Request() req: any,
  ) {
    return this.productsService.updateProduct(id, dto, req.user?.id);
  }

  // Price calculation
  @Post('price')
  @RequirePermissions({ resource: 'products', action: 'read' })
  @ApiOperation({ summary: 'Get effective price for product and customer' })
  @ApiResponse({ status: 200, description: 'Returns price calculation' })
  async getPrice(@Body() dto: GetPriceDto) {
    return this.productsService.getEffectivePrice(
      dto.productId,
      dto.customerId,
      dto.quantity,
    );
  }
}

@ApiTags('Pricing Tiers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('pricing-tiers')
export class PricingTiersController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @RequirePermissions({ resource: 'products', action: 'read' })
  @ApiOperation({ summary: 'Get all pricing tiers' })
  @ApiResponse({ status: 200, description: 'Returns pricing tiers list' })
  async findAll() {
    return this.productsService.findAllPricingTiers();
  }

  @Get(':id')
  @RequirePermissions({ resource: 'products', action: 'read' })
  @ApiOperation({ summary: 'Get pricing tier by ID' })
  @ApiParam({ name: 'id', description: 'Pricing tier ID' })
  @ApiResponse({ status: 200, description: 'Returns pricing tier details' })
  @ApiResponse({ status: 404, description: 'Pricing tier not found' })
  async findById(@Param('id') id: string) {
    return this.productsService.findPricingTierById(id);
  }

  @Post()
  @RequirePermissions({ resource: 'products', action: 'create' })
  @ApiOperation({ summary: 'Create a new pricing tier' })
  @ApiResponse({ status: 201, description: 'Pricing tier created successfully' })
  async create(@Body() dto: CreatePricingTierDto, @Request() req: any) {
    return this.productsService.createPricingTier(dto, req.user?.id);
  }

  @Put(':id')
  @RequirePermissions({ resource: 'products', action: 'update' })
  @ApiOperation({ summary: 'Update a pricing tier' })
  @ApiParam({ name: 'id', description: 'Pricing tier ID' })
  @ApiResponse({ status: 200, description: 'Pricing tier updated successfully' })
  @ApiResponse({ status: 404, description: 'Pricing tier not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePricingTierDto,
    @Request() req: any,
  ) {
    return this.productsService.updatePricingTier(id, dto, req.user?.id);
  }

  @Post('tier-price')
  @RequirePermissions({ resource: 'products', action: 'update' })
  @ApiOperation({ summary: 'Set tier-specific price for a product' })
  @ApiResponse({ status: 200, description: 'Tier price set successfully' })
  async setTierPrice(@Body() dto: SetTierPriceDto, @Request() req: any) {
    return this.productsService.setTierPrice(dto, req.user?.id);
  }

  @Post('customer-price')
  @RequirePermissions({ resource: 'products', action: 'update' })
  @ApiOperation({ summary: 'Set customer-specific price for a product' })
  @ApiResponse({ status: 200, description: 'Customer price set successfully' })
  async setCustomerPrice(@Body() dto: SetCustomerPriceDto, @Request() req: any) {
    return this.productsService.setCustomerPrice(dto, req.user?.id);
  }
}
