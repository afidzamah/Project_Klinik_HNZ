import { Module } from '@nestjs/common';
import { ResepService } from './resep.service';
import { ResepController } from './resep.controller';

@Module({
  controllers: [ResepController],
  providers: [ResepService],
})
export class ResepModule {}
