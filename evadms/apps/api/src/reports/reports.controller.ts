import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // Sales Reports
  @Get('sales/summary')
  @RequirePermissions({ resource: 'reports', action: 'read' })
  @ApiOperation({ summary: 'Get sales summary report' })
  async getSalesSummary(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.reportsService.getSalesSummary(
      new Date(fromDate),
      new Date(toDate),
    );
  }

  @Get('sales/by-customer-type')
  @RequirePermissions({ resource: 'reports', action: 'read' })
  @ApiOperation({ summary: 'Get sales by customer type' })
  async getSalesByCustomerType(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.reportsService.getSalesByCustomerType(
      new Date(fromDate),
      new Date(toDate),
    );
  }

  @Get('sales/by-product')
  @RequirePermissions({ resource: 'reports', action: 'read' })
  @ApiOperation({ summary: 'Get sales by product' })
  async getSalesByProduct(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.reportsService.getSalesByProduct(
      new Date(fromDate),
      new Date(toDate),
    );
  }

  // Delivery Reports
  @Get('delivery/performance')
  @RequirePermissions({ resource: 'reports', action: 'read' })
  @ApiOperation({ summary: 'Get delivery performance report' })
  async getDeliveryPerformance(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.reportsService.getDeliveryPerformance(
      new Date(fromDate),
      new Date(toDate),
    );
  }

  @Get('delivery/drivers')
  @RequirePermissions({ resource: 'reports', action: 'read' })
  @ApiOperation({ summary: 'Get driver performance report' })
  async getDriverPerformance(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.reportsService.getDriverPerformance(
      new Date(fromDate),
      new Date(toDate),
    );
  }

  // Inventory Reports
  @Get('inventory/summary')
  @RequirePermissions({ resource: 'reports', action: 'read' })
  @ApiOperation({ summary: 'Get inventory summary' })
  async getInventorySummary() {
    return this.reportsService.getInventorySummary();
  }

  @Get('inventory/movements')
  @RequirePermissions({ resource: 'reports', action: 'read' })
  @ApiOperation({ summary: 'Get cylinder movement report' })
  async getCylinderMovements(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.reportsService.getCylinderMovementReport(
      new Date(fromDate),
      new Date(toDate),
    );
  }

  // Customer Reports
  @Get('customers/top')
  @RequirePermissions({ resource: 'reports', action: 'read' })
  @ApiOperation({ summary: 'Get top customers by revenue' })
  async getTopCustomers(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
    @Query('limit') limit?: number,
  ) {
    return this.reportsService.getTopCustomers(
      new Date(fromDate),
      new Date(toDate),
      limit || 10,
    );
  }

  @Get('customers/retention')
  @RequirePermissions({ resource: 'reports', action: 'read' })
  @ApiOperation({ summary: 'Get customer retention report' })
  async getCustomerRetention(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.reportsService.getCustomerRetention(
      new Date(fromDate),
      new Date(toDate),
    );
  }

  // Compliance Reports
  @Get('compliance/checklists')
  @RequirePermissions({ resource: 'reports', action: 'read' })
  @ApiOperation({ summary: 'Get checklist compliance report' })
  async getChecklistCompliance(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.reportsService.getChecklistComplianceReport(
      new Date(fromDate),
      new Date(toDate),
    );
  }
}
