import { Test, TestingModule } from '@nestjs/testing';
import { ResepController } from './resep.controller';
import { ResepService } from './resep.service';

describe('ResepController', () => {
  let controller: ResepController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResepController],
      providers: [ResepService],
    }).compile();

    controller = module.get<ResepController>(ResepController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
