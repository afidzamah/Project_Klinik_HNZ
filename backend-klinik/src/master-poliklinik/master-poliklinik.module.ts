import { Module } from '@nestjs/common';
import { MasterPoliklinikService } from './master-poliklinik.service';
import { MasterPoliklinikController } from './master-poliklinik.controller';

@Module({
  controllers: [MasterPoliklinikController],
  providers: [MasterPoliklinikService],
})
export class MasterPoliklinikModule {}
