import { Module } from '@nestjs/common';
import { PemeriksaanDokterService } from './pemeriksaan-dokter.service';
import { PemeriksaanDokterController } from './pemeriksaan-dokter.controller';

@Module({
  controllers: [PemeriksaanDokterController],
  providers: [PemeriksaanDokterService],
})
export class PemeriksaanDokterModule {}
