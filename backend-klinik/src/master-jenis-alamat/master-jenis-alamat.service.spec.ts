import { Test, TestingModule } from '@nestjs/testing';
import { MasterJenisAlamatService } from './master-jenis-alamat.service';

describe('MasterJenisAlamatService', () => {
  let service: MasterJenisAlamatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MasterJenisAlamatService],
    }).compile();

    service = module.get<MasterJenisAlamatService>(MasterJenisAlamatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
