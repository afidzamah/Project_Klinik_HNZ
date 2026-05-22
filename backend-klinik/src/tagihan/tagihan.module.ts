import { Module } from '@nestjs/common';
import { TagihanService } from './tagihan.service';
import { TagihanController } from './tagihan.controller';

@Module({
  controllers: [TagihanController],
  providers: [TagihanService],
})
export class TagihanModule {}
