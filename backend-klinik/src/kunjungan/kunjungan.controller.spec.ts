import { Test, TestingModule } from '@nestjs/testing';
import { KunjunganController } from './kunjungan.controller';
import { KunjunganService } from './kunjungan.service';

describe('KunjunganController', () => {
  let controller: KunjunganController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KunjunganController],
      providers: [KunjunganService],
    }).compile();

    controller = module.get<KunjunganController>(KunjunganController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
