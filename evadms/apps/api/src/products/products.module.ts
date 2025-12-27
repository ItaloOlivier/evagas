import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController, PricingTiersController } from './products.controller';

@Module({
  providers: [ProductsService],
  controllers: [ProductsController, PricingTiersController],
  exports: [ProductsService],
})
export class ProductsModule {}
