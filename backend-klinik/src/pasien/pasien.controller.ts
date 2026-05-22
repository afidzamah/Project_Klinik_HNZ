import { Controller, Get, Post, Body } from '@nestjs/common';
import { PasienService } from './pasien.service';

@Controller('pasien')
export class PasienController {
  constructor(private readonly pasienService: PasienService) {}

  @Post() // Jalur untuk mengirim/menyimpan data
  create(@Body() createPasienDto: any) {
    return this.pasienService.create(createPasienDto);
  }

  @Get() // Jalur untuk mengambil/melihat data
  findAll() {
    return this.pasienService.findAll();
  }
}