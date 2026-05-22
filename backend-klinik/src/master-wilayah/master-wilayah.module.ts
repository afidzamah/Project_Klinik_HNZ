import { Module } from '@nestjs/common';
import { MasterWilayahService } from './master-wilayah.service';
import { MasterWilayahController } from './master-wilayah.controller';
import { PrismaService } from '../prisma/prisma.service'; // Sesuaikan path jika perlu

@Module({
  controllers: [MasterWilayahController],
  providers: [MasterWilayahService, PrismaService],
})
export class MasterWilayahModule {}