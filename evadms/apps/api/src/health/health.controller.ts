import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  async healthCheck() {
    try {
      // Check database connection
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'connected',
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          database: 'disconnected',
          error: error.message,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'API root endpoint' })
  async root() {
    return {
      name: 'EVADMS API',
      version: '1.0.0',
      description: 'EVA Gas Depot Management System',
      documentation: '/api/docs',
    };
  }

  @Get('debug/users-test')
  @ApiOperation({ summary: 'Debug: Test users query (no auth)' })
  async debugUsersTest() {
    try {
      console.log('[HealthController] debugUsersTest - Starting...');

      const users = await this.prisma.user.findMany({
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
        take: 5,
      });

      console.log('[HealthController] debugUsersTest - Found', users.length, 'users');

      return {
        success: true,
        count: users.length,
        users: users.map((u) => ({
          id: u.id,
          email: u.email,
          firstName: u.firstName,
          status: u.status,
          roles: u.roles.map((r) => r.role.name),
        })),
      };
    } catch (error) {
      console.error('[HealthController] debugUsersTest - ERROR:', error);
      return {
        success: false,
        error: error.message,
        stack: error.stack,
      };
    }
  }
}
