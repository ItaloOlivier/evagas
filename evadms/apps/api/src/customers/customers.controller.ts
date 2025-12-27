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
import { CustomersService } from './customers.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerQueryDto,
  CreateSiteDto,
  UpdateSiteDto,
} from './dto/customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @RequirePermissions({ resource: 'customers', action: 'read' })
  @ApiOperation({ summary: 'Get all customers with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated customers list' })
  async findAll(@Query() query: CustomerQueryDto) {
    return this.customersService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions({ resource: 'customers', action: 'read' })
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Returns customer details' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findById(@Param('id') id: string) {
    return this.customersService.findById(id);
  }

  @Get('account/:accountNumber')
  @RequirePermissions({ resource: 'customers', action: 'read' })
  @ApiOperation({ summary: 'Get customer by account number' })
  @ApiParam({ name: 'accountNumber', description: 'Customer account number' })
  @ApiResponse({ status: 200, description: 'Returns customer details' })
  async findByAccountNumber(@Param('accountNumber') accountNumber: string) {
    return this.customersService.findByAccountNumber(accountNumber);
  }

  @Post()
  @RequirePermissions({ resource: 'customers', action: 'create' })
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() dto: CreateCustomerDto, @Request() req: any) {
    return this.customersService.create(dto, req.user?.id);
  }

  @Put(':id')
  @RequirePermissions({ resource: 'customers', action: 'update' })
  @ApiOperation({ summary: 'Update a customer' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @Request() req: any,
  ) {
    return this.customersService.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  @RequirePermissions({ resource: 'customers', action: 'delete' })
  @ApiOperation({ summary: 'Deactivate a customer (soft delete)' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Customer deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.customersService.delete(id, req.user?.id);
  }

  // Site endpoints
  @Get(':customerId/sites')
  @RequirePermissions({ resource: 'customers', action: 'read' })
  @ApiOperation({ summary: 'Get all sites for a customer' })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Returns customer sites' })
  async getSites(@Param('customerId') customerId: string) {
    return this.customersService.getSites(customerId);
  }

  @Post(':customerId/sites')
  @RequirePermissions({ resource: 'customers', action: 'update' })
  @ApiOperation({ summary: 'Add a new site to a customer' })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiResponse({ status: 201, description: 'Site created successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async createSite(
    @Param('customerId') customerId: string,
    @Body() dto: CreateSiteDto,
  ) {
    return this.customersService.createSite(customerId, dto);
  }

  @Put(':customerId/sites/:siteId')
  @RequirePermissions({ resource: 'customers', action: 'update' })
  @ApiOperation({ summary: 'Update a customer site' })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiParam({ name: 'siteId', description: 'Site ID' })
  @ApiResponse({ status: 200, description: 'Site updated successfully' })
  @ApiResponse({ status: 404, description: 'Site not found' })
  async updateSite(
    @Param('customerId') customerId: string,
    @Param('siteId') siteId: string,
    @Body() dto: UpdateSiteDto,
  ) {
    return this.customersService.updateSite(customerId, siteId, dto);
  }

  @Delete(':customerId/sites/:siteId')
  @RequirePermissions({ resource: 'customers', action: 'update' })
  @ApiOperation({ summary: 'Deactivate a customer site' })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiParam({ name: 'siteId', description: 'Site ID' })
  @ApiResponse({ status: 200, description: 'Site deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Site not found' })
  async deleteSite(
    @Param('customerId') customerId: string,
    @Param('siteId') siteId: string,
  ) {
    return this.customersService.deleteSite(customerId, siteId);
  }
}
