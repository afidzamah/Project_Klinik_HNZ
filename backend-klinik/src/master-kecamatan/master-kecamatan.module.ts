import { Module } from '@nestjs/common';
import { MasterKecamatanService } from './master-kecamatan.service';
import { MasterKecamatanController } from './master-kecamatan.controller';

@Module({
  controllers: [MasterKecamatanController],
  providers: [MasterKecamatanService],
})
export class MasterKecamatanModule {}
