import { Test, TestingModule } from '@nestjs/testing';
import { AntreanService } from './antrean.service';

describe('AntreanService', () => {
  let service: AntreanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AntreanService],
    }).compile();

    service = module.get<AntreanService>(AntreanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
