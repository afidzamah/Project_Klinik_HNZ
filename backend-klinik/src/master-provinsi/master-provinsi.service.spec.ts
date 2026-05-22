import { Test, TestingModule } from '@nestjs/testing';
import { MasterProvinsiService } from './master-provinsi.service';

describe('MasterProvinsiService', () => {
  let service: MasterProvinsiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MasterProvinsiService],
    }).compile();

    service = module.get<MasterProvinsiService>(MasterProvinsiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
