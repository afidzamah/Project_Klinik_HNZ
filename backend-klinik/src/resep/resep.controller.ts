import { Controller, Get, Post, Body, Delete, Param, Patch } from '@nestjs/common';
import { ResepService } from './resep.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateResepDto } from './dto/create-resep.dto';

@ApiTags('Farmasi / Apotek (E-Prescribing)')
@Controller('resep')
export class ResepController {
  constructor(private readonly resepService: ResepService) {}

  @Post()
  @ApiOperation({ summary: 'Dokter: Kirim Resep ke Apotek' })
  create(@Body() createResepDto: CreateResepDto) {
    return this.resepService.create(createResepDto);
  }

  @Get()
  @ApiOperation({ summary: 'Apoteker: Lihat Daftar Resep Masuk' })
  findAll() {
    return this.resepService.findAll();
  }

  @Get('master-obat')
  @ApiOperation({ summary: 'Dokter/Apoteker: Ambil Master Obat & Safety Info dari Database' })
  findMasterObat() {
    return this.resepService.findMasterObat();
  }

  @Patch(':id/serahkan')
  @ApiOperation({ summary: 'Apoteker: Verifikasi & Serahkan Obat ke Pasien (Posting ke Billing)' })
  serahkan(@Param('id') id: string) {
    return this.resepService.serahkan(id);
  }

  @Patch(':id/proses')
  @ApiOperation({ summary: 'Apoteker: Proses/Siapkan Obat (Pindahkan ke Pending)' })
  proses(@Param('id') id: string) {
    return this.resepService.proses(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Apoteker: Hapus/Batalkan Order Resep' })
  remove(@Param('id') id: string) {
    return this.resepService.remove(id);
  }
}