import { Test, TestingModule } from '@nestjs/testing';
import { MasterKabupatenService } from './master-kabupaten.service';

describe('MasterKabupatenService', () => {
  let service: MasterKabupatenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MasterKabupatenService],
    }).compile();

    service = module.get<MasterKabupatenService>(MasterKabupatenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
