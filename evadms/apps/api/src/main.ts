import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // Global prefix (exclude health endpoint for Railway healthcheck)
  app.setGlobalPrefix('api/v1', {
    exclude: ['health', '/'],
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('EVADMS API')
    .setDescription('EVA Gas Depot Management System API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('customers', 'Customer management')
    .addTag('products', 'Products and pricing')
    .addTag('quotes', 'Quote management')
    .addTag('orders', 'Order management')
    .addTag('schedule', 'Scheduling and dispatch')
    .addTag('inventory', 'Inventory management')
    .addTag('checklists', 'Checklists and forms')
    .addTag('pod', 'Proof of delivery')
    .addTag('reports', 'Reports and exports')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log(`🚀 EVADMS API running on port ${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
