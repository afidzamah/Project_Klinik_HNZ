import { Module } from '@nestjs/common';
import { MasterTindakanService } from './master-tindakan.service';
import { MasterTindakanController } from './master-tindakan.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MasterTindakanController],
  providers: [MasterTindakanService],
  exports: [MasterTindakanService],
})
export class MasterTindakanModule {}
