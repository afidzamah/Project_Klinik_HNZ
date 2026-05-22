import { Test, TestingModule } from '@nestjs/testing';
import { MasterKabupatenController } from './master-kabupaten.controller';
import { MasterKabupatenService } from './master-kabupaten.service';

describe('MasterKabupatenController', () => {
  let controller: MasterKabupatenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MasterKabupatenController],
      providers: [MasterKabupatenService],
    }).compile();

    controller = module.get<MasterKabupatenController>(MasterKabupatenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
