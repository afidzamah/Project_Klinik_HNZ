import { Test, TestingModule } from '@nestjs/testing';
import { MasterPoliklinikService } from './master-poliklinik.service';

describe('MasterPoliklinikService', () => {
  let service: MasterPoliklinikService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MasterPoliklinikService],
    }).compile();

    service = module.get<MasterPoliklinikService>(MasterPoliklinikService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
