import { Controller, Get } from '@nestjs/common';
import { MasterPoliklinikService } from './master-poliklinik.service';

@Controller('master-poliklinik')
export class MasterPoliklinikController {
  constructor(private readonly poliklinikService: MasterPoliklinikService) {}

  @Get()
  findAll() {
    return this.poliklinikService.findAll();
  }
}