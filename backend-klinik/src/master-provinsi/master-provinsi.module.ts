import { Module } from '@nestjs/common';
import { MasterProvinsiService } from './master-provinsi.service';
import { MasterProvinsiController } from './master-provinsi.controller';

@Module({
  controllers: [MasterProvinsiController],
  providers: [MasterProvinsiService],
})
export class MasterProvinsiModule {}
