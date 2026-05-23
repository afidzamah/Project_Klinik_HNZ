import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
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

  @Get('nik/:nik') // Jalur untuk mencari data pasien berdasarkan NIK
  findByNik(@Param('nik') nik: string) {
    return this.pasienService.findByNik(nik);
  }

  @Patch(':id') // Jalur untuk mengedit data pasien
  update(@Param('id') id: string, @Body() updatePasienDto: any) {
    return this.pasienService.update(id, updatePasienDto);
  }
}