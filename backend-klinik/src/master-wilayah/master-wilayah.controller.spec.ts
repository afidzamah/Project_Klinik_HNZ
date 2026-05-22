import { Test, TestingModule } from '@nestjs/testing';
import { MasterWilayahController } from './master-wilayah.controller';

describe('MasterWilayahController', () => {
  let controller: MasterWilayahController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MasterWilayahController],
    }).compile();

    controller = module.get<MasterWilayahController>(MasterWilayahController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
