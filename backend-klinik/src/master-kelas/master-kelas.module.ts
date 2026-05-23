import { Module } from '@nestjs/common';
import { MasterKelasService } from './master-kelas.service';
import { MasterKelasController } from './master-kelas.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MasterKelasController],
  providers: [MasterKelasService],
  exports: [MasterKelasService],
})
export class MasterKelasModule {}
