import { Module } from '@nestjs/common';
import { MasterDokterService } from './master-dokter.service';
import { MasterDokterController } from './master-dokter.controller';

@Module({
  controllers: [MasterDokterController],
  providers: [MasterDokterService],
})
export class MasterDokterModule {}
