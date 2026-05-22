import { Test, TestingModule } from '@nestjs/testing';
import { MasterKecamatanService } from './master-kecamatan.service';

describe('MasterKecamatanService', () => {
  let service: MasterKecamatanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MasterKecamatanService],
    }).compile();

    service = module.get<MasterKecamatanService>(MasterKecamatanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
