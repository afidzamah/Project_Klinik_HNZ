import { Module } from '@nestjs/common';
import { AntreanService } from './antrean.service';
import { AntreanController } from './antrean.controller';

@Module({
  controllers: [AntreanController],
  providers: [AntreanService],
})
export class AntreanModule {}
