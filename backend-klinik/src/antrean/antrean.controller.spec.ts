import { Test, TestingModule } from '@nestjs/testing';
import { AntreanController } from './antrean.controller';
import { AntreanService } from './antrean.service';

describe('AntreanController', () => {
  let controller: AntreanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AntreanController],
      providers: [AntreanService],
    }).compile();

    controller = module.get<AntreanController>(AntreanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
