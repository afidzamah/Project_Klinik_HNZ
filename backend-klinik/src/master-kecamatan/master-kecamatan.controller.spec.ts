import { Test, TestingModule } from '@nestjs/testing';
import { MasterKecamatanController } from './master-kecamatan.controller';
import { MasterKecamatanService } from './master-kecamatan.service';

describe('MasterKecamatanController', () => {
  let controller: MasterKecamatanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MasterKecamatanController],
      providers: [MasterKecamatanService],
    }).compile();

    controller = module.get<MasterKecamatanController>(MasterKecamatanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
