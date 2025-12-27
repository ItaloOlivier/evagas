import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CustomersModule } from './customers/customers.module';
import { ProductsModule } from './products/products.module';
import { QuotesModule } from './quotes/quotes.module';
import { OrdersModule } from './orders/orders.module';
import { ScheduleModule } from './schedule/schedule.module';
import { InventoryModule } from './inventory/inventory.module';
import { ChecklistsModule } from './checklists/checklists.module';
import { PODModule } from './pod/pod.module';
import { AuditModule } from './audit/audit.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Core modules
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,

    // Business modules
    CustomersModule,
    ProductsModule,
    QuotesModule,
    OrdersModule,
    ScheduleModule,
    InventoryModule,
    ChecklistsModule,
    PODModule,

    // Support modules
    AuditModule,
    ReportsModule,
  ],
})
export class AppModule {}
