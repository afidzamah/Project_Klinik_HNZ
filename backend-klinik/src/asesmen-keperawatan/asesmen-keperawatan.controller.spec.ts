import { Test, TestingModule } from '@nestjs/testing';
import { AsesmenKeperawatanController } from './asesmen-keperawatan.controller';
import { AsesmenKeperawatanService } from './asesmen-keperawatan.service';

describe('AsesmenKeperawatanController', () => {
  let controller: AsesmenKeperawatanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AsesmenKeperawatanController],
      providers: [AsesmenKeperawatanService],
    }).compile();

    controller = module.get<AsesmenKeperawatanController>(AsesmenKeperawatanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
