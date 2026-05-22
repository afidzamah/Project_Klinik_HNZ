import { Test, TestingModule } from '@nestjs/testing';
import { KunjunganService } from './kunjungan.service';

describe('KunjunganService', () => {
  let service: KunjunganService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KunjunganService],
    }).compile();

    service = module.get<KunjunganService>(KunjunganService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
