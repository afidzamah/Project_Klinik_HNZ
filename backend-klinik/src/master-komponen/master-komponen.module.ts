import { Module } from '@nestjs/common';
import { MasterKomponenService } from './master-komponen.service';
import { MasterKomponenController } from './master-komponen.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MasterKomponenController],
  providers: [MasterKomponenService],
  exports: [MasterKomponenService],
})
export class MasterKomponenModule {}
