import { Module } from '@nestjs/common';
import { MasterKabupatenService } from './master-kabupaten.service';
import { MasterKabupatenController } from './master-kabupaten.controller';

@Module({
  controllers: [MasterKabupatenController],
  providers: [MasterKabupatenService],
})
export class MasterKabupatenModule {}
