import { Module } from '@nestjs/common';
import { AsesmenKeperawatanService } from './asesmen-keperawatan.service';
import { AsesmenKeperawatanController } from './asesmen-keperawatan.controller';

@Module({
  controllers: [AsesmenKeperawatanController],
  providers: [AsesmenKeperawatanService],
})
export class AsesmenKeperawatanModule {}
