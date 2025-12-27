import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import {
  CylinderInventoryController,
  RefillBatchController,
  TankInventoryController,
} from './inventory.controller';

@Module({
  providers: [InventoryService],
  controllers: [CylinderInventoryController, RefillBatchController, TankInventoryController],
  exports: [InventoryService],
})
export class InventoryModule {}
