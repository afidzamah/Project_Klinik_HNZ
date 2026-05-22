import { Test, TestingModule } from '@nestjs/testing';
import { AsesmenKeperawatanService } from './asesmen-keperawatan.service';

describe('AsesmenKeperawatanService', () => {
  let service: AsesmenKeperawatanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AsesmenKeperawatanService],
    }).compile();

    service = module.get<AsesmenKeperawatanService>(AsesmenKeperawatanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
