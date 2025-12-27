import { Module } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { ScheduleController, VehiclesController, DriversController } from './schedule.controller';

@Module({
  providers: [ScheduleService],
  controllers: [ScheduleController, VehiclesController, DriversController],
  exports: [ScheduleService],
})
export class ScheduleModule {}
