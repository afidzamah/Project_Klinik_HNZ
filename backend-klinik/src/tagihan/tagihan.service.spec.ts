import { Test, TestingModule } from '@nestjs/testing';
import { TagihanService } from './tagihan.service';

describe('TagihanService', () => {
  let service: TagihanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TagihanService],
    }).compile();

    service = module.get<TagihanService>(TagihanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
