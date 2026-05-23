import { Module } from '@nestjs/common';
import { PengaturanService } from './pengaturan.service';
import { PengaturanController } from './pengaturan.controller';

@Module({
  controllers: [PengaturanController],
  providers: [PengaturanService],
  exports: [PengaturanService], // Export in case auth or other modules want to use it
})
export class PengaturanModule {}
