import { Test, TestingModule } from '@nestjs/testing';
import { MasterJenisAlamatController } from './master-jenis-alamat.controller';
import { MasterJenisAlamatService } from './master-jenis-alamat.service';

describe('MasterJenisAlamatController', () => {
  let controller: MasterJenisAlamatController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MasterJenisAlamatController],
      providers: [MasterJenisAlamatService],
    }).compile();

    controller = module.get<MasterJenisAlamatController>(MasterJenisAlamatController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
