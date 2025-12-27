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
import { QuotesService } from './quotes.service';
import {
  CreateQuoteDto,
  UpdateQuoteDto,
  QuoteQueryDto,
  SendQuoteDto,
  AcceptQuoteDto,
  RejectQuoteDto,
} from './dto/quote.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Quotes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get()
  @RequirePermissions({ resource: 'quotes', action: 'read' })
  @ApiOperation({ summary: 'Get all quotes with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated quotes list' })
  async findAll(@Query() query: QuoteQueryDto) {
    return this.quotesService.findAll(query);
  }

  @Get('statistics')
  @RequirePermissions({ resource: 'quotes', action: 'read' })
  @ApiOperation({ summary: 'Get quote statistics' })
  @ApiResponse({ status: 200, description: 'Returns quote statistics' })
  async getStatistics(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.quotesService.getStatistics(
      fromDate ? new Date(fromDate) : undefined,
      toDate ? new Date(toDate) : undefined,
    );
  }

  @Get(':id')
  @RequirePermissions({ resource: 'quotes', action: 'read' })
  @ApiOperation({ summary: 'Get quote by ID' })
  @ApiParam({ name: 'id', description: 'Quote ID' })
  @ApiResponse({ status: 200, description: 'Returns quote details' })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  async findById(@Param('id') id: string) {
    return this.quotesService.findById(id);
  }

  @Get('number/:quoteNumber')
  @RequirePermissions({ resource: 'quotes', action: 'read' })
  @ApiOperation({ summary: 'Get quote by quote number' })
  @ApiParam({ name: 'quoteNumber', description: 'Quote number' })
  @ApiResponse({ status: 200, description: 'Returns quote details' })
  async findByQuoteNumber(@Param('quoteNumber') quoteNumber: string) {
    return this.quotesService.findByQuoteNumber(quoteNumber);
  }

  @Post()
  @RequirePermissions({ resource: 'quotes', action: 'create' })
  @ApiOperation({ summary: 'Create a new quote' })
  @ApiResponse({ status: 201, description: 'Quote created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() dto: CreateQuoteDto, @Request() req: any) {
    return this.quotesService.create(dto, req.user?.id);
  }

  @Put(':id')
  @RequirePermissions({ resource: 'quotes', action: 'update' })
  @ApiOperation({ summary: 'Update a draft quote' })
  @ApiParam({ name: 'id', description: 'Quote ID' })
  @ApiResponse({ status: 200, description: 'Quote updated successfully' })
  @ApiResponse({ status: 400, description: 'Only draft quotes can be updated' })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateQuoteDto,
    @Request() req: any,
  ) {
    return this.quotesService.update(id, dto, req.user?.id);
  }

  // State transitions
  @Post(':id/send')
  @RequirePermissions({ resource: 'quotes', action: 'update' })
  @ApiOperation({ summary: 'Send quote to customer' })
  @ApiParam({ name: 'id', description: 'Quote ID' })
  @ApiResponse({ status: 200, description: 'Quote sent successfully' })
  @ApiResponse({ status: 400, description: 'Cannot send quote from current status' })
  async send(
    @Param('id') id: string,
    @Body() dto: SendQuoteDto,
    @Request() req: any,
  ) {
    return this.quotesService.send(id, dto, req.user?.id);
  }

  @Post(':id/accept')
  @RequirePermissions({ resource: 'quotes', action: 'update' })
  @ApiOperation({ summary: 'Accept quote' })
  @ApiParam({ name: 'id', description: 'Quote ID' })
  @ApiResponse({ status: 200, description: 'Quote accepted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot accept quote from current status' })
  async accept(
    @Param('id') id: string,
    @Body() dto: AcceptQuoteDto,
    @Request() req: any,
  ) {
    return this.quotesService.accept(id, dto, req.user?.id);
  }

  @Post(':id/reject')
  @RequirePermissions({ resource: 'quotes', action: 'update' })
  @ApiOperation({ summary: 'Reject quote' })
  @ApiParam({ name: 'id', description: 'Quote ID' })
  @ApiResponse({ status: 200, description: 'Quote rejected successfully' })
  @ApiResponse({ status: 400, description: 'Cannot reject quote from current status' })
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectQuoteDto,
    @Request() req: any,
  ) {
    return this.quotesService.reject(id, dto, req.user?.id);
  }

  @Post(':id/convert')
  @RequirePermissions({ resource: 'orders', action: 'create' })
  @ApiOperation({ summary: 'Convert quote to order' })
  @ApiParam({ name: 'id', description: 'Quote ID' })
  @ApiResponse({ status: 201, description: 'Order created from quote' })
  @ApiResponse({ status: 400, description: 'Cannot convert quote from current status' })
  async convertToOrder(@Param('id') id: string, @Request() req: any) {
    return this.quotesService.convertToOrder(id, req.user?.id);
  }

  // Admin operations
  @Post('expire-overdue')
  @RequirePermissions({ resource: 'quotes', action: 'update' })
  @ApiOperation({ summary: 'Expire all overdue quotes' })
  @ApiResponse({ status: 200, description: 'Returns count of expired quotes' })
  async expireOverdue() {
    return this.quotesService.expireOverdueQuotes();
  }
}
