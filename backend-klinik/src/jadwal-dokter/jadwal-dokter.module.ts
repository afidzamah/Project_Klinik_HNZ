import { Module } from '@nestjs/common';
import { JadwalDokterService } from './jadwal-dokter.service';
import { JadwalDokterController } from './jadwal-dokter.controller';

@Module({
  controllers: [JadwalDokterController],
  providers: [JadwalDokterService],
})
export class JadwalDokterModule {}
