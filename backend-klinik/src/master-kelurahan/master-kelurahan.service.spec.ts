import { Test, TestingModule } from '@nestjs/testing';
import { MasterKelurahanService } from './master-kelurahan.service';

describe('MasterKelurahanService', () => {
  let service: MasterKelurahanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MasterKelurahanService],
    }).compile();

    service = module.get<MasterKelurahanService>(MasterKelurahanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
