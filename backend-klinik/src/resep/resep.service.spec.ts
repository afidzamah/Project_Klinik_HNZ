import { Test, TestingModule } from '@nestjs/testing';
import { ResepService } from './resep.service';

describe('ResepService', () => {
  let service: ResepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResepService],
    }).compile();

    service = module.get<ResepService>(ResepService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
