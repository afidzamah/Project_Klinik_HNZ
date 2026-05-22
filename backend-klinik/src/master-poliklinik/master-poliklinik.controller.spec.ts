import { Test, TestingModule } from '@nestjs/testing';
import { MasterPoliklinikController } from './master-poliklinik.controller';
import { MasterPoliklinikService } from './master-poliklinik.service';

describe('MasterPoliklinikController', () => {
  let controller: MasterPoliklinikController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MasterPoliklinikController],
      providers: [MasterPoliklinikService],
    }).compile();

    controller = module.get<MasterPoliklinikController>(MasterPoliklinikController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
