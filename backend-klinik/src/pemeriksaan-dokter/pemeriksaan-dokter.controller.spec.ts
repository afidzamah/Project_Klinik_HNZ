import { Test, TestingModule } from '@nestjs/testing';
import { PemeriksaanDokterController } from './pemeriksaan-dokter.controller';
import { PemeriksaanDokterService } from './pemeriksaan-dokter.service';

describe('PemeriksaanDokterController', () => {
  let controller: PemeriksaanDokterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PemeriksaanDokterController],
      providers: [PemeriksaanDokterService],
    }).compile();

    controller = module.get<PemeriksaanDokterController>(PemeriksaanDokterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
