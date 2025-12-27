import { Module } from '@nestjs/common';
import { ChecklistsService } from './checklists.service';
import { ChecklistTemplatesController, ChecklistResponsesController } from './checklists.controller';

@Module({
  providers: [ChecklistsService],
  controllers: [ChecklistTemplatesController, ChecklistResponsesController],
  exports: [ChecklistsService],
})
export class ChecklistsModule {}
