import { Test, TestingModule } from '@nestjs/testing';
import { MasterKelurahanController } from './master-kelurahan.controller';
import { MasterKelurahanService } from './master-kelurahan.service';

describe('MasterKelurahanController', () => {
  let controller: MasterKelurahanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MasterKelurahanController],
      providers: [MasterKelurahanService],
    }).compile();

    controller = module.get<MasterKelurahanController>(MasterKelurahanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
