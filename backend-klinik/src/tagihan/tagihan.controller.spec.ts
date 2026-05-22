import { Test, TestingModule } from '@nestjs/testing';
import { TagihanController } from './tagihan.controller';
import { TagihanService } from './tagihan.service';

describe('TagihanController', () => {
  let controller: TagihanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TagihanController],
      providers: [TagihanService],
    }).compile();

    controller = module.get<TagihanController>(TagihanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
