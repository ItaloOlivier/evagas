import { Module } from '@nestjs/common';
import { PODService } from './pod.service';
import { PODController } from './pod.controller';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [InventoryModule],
  providers: [PODService],
  controllers: [PODController],
  exports: [PODService],
})
export class PODModule {}
