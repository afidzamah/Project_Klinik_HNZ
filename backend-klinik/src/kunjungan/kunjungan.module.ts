import { Module } from '@nestjs/common';
import { KunjunganService } from './kunjungan.service';
import { KunjunganController } from './kunjungan.controller';

@Module({
  controllers: [KunjunganController],
  providers: [KunjunganService],
})
export class KunjunganModule {}
