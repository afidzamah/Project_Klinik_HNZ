import { Module } from '@nestjs/common';
import { MasterCaraBayarService } from './master-cara-bayar.service';
import { MasterCaraBayarController } from './master-cara-bayar.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MasterCaraBayarController],
  providers: [MasterCaraBayarService],
  exports: [MasterCaraBayarService],
})
export class MasterCaraBayarModule {}
