import { Test, TestingModule } from '@nestjs/testing';
import { PemeriksaanDokterService } from './pemeriksaan-dokter.service';

describe('PemeriksaanDokterService', () => {
  let service: PemeriksaanDokterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PemeriksaanDokterService],
    }).compile();

    service = module.get<PemeriksaanDokterService>(PemeriksaanDokterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
