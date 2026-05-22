import { Module } from '@nestjs/common';
import { MasterJenisAlamatService } from './master-jenis-alamat.service';
import { MasterJenisAlamatController } from './master-jenis-alamat.controller';

@Module({
  controllers: [MasterJenisAlamatController],
  providers: [MasterJenisAlamatService],
})
export class MasterJenisAlamatModule {}
