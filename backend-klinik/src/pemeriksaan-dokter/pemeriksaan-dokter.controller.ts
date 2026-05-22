import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PemeriksaanDokterService } from './pemeriksaan-dokter.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Doctor Examination (SOAP)')
@Controller('pemeriksaan-dokter')
export class PemeriksaanDokterController {
  constructor(private readonly pemeriksaanDokterService: PemeriksaanDokterService) {}

  @Post()
  create(@Body() createDto: any) {
    return this.pemeriksaanDokterService.create(createDto);
  }

  @Post('analisis-ai')
  async dapatkanAnalisisAI(@Body() body: { id_kunjungan: string; anamnesis_subjektif: string }) {
    return this.pemeriksaanDokterService.analisisDiagnosaAI(body.id_kunjungan, body.anamnesis_subjektif);
  }

  @Get()
  findAll() {
    // Sekarang baris ini dijamin aman karena fungsinya sudah kita buat di atas!
    return this.pemeriksaanDokterService.findAll();
  }
}