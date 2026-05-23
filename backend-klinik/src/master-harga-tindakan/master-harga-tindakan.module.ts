import { Module } from '@nestjs/common';
import { MasterHargaTindakanService } from './master-harga-tindakan.service';
import { MasterHargaTindakanController } from './master-harga-tindakan.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MasterHargaTindakanController],
  providers: [MasterHargaTindakanService],
  exports: [MasterHargaTindakanService],
})
export class MasterHargaTindakanModule {}
