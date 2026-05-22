import { Controller, Get } from '@nestjs/common';
import { MasterDokterService } from './master-dokter.service';

@Controller('master-dokter')
export class MasterDokterController {
  constructor(private readonly dokterService: MasterDokterService) {}

  @Get()
  findAll() {
    return this.dokterService.findAll();
  }
}