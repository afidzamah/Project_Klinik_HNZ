import { Module } from '@nestjs/common';
import { PasienService } from './pasien.service';
import { PasienController } from './pasien.controller';

@Module({
  controllers: [PasienController],
  providers: [PasienService],
})
export class PasienModule {}
