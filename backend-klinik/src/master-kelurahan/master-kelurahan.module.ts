import { Module } from '@nestjs/common';
import { MasterKelurahanService } from './master-kelurahan.service';
import { MasterKelurahanController } from './master-kelurahan.controller';

@Module({
  controllers: [MasterKelurahanController],
  providers: [MasterKelurahanService],
})
export class MasterKelurahanModule {}
