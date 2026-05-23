import { Module } from '@nestjs/common';
import { MasterAsalRujukanService } from './master-asal-rujukan.service';
import { MasterAsalRujukanController } from './master-asal-rujukan.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MasterAsalRujukanController],
  providers: [MasterAsalRujukanService],
  exports: [MasterAsalRujukanService],
})
export class MasterAsalRujukanModule {}
