import { Test, TestingModule } from '@nestjs/testing';
import { MasterProvinsiController } from './master-provinsi.controller';
import { MasterProvinsiService } from './master-provinsi.service';

describe('MasterProvinsiController', () => {
  let controller: MasterProvinsiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MasterProvinsiController],
      providers: [MasterProvinsiService],
    }).compile();

    controller = module.get<MasterProvinsiController>(MasterProvinsiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
