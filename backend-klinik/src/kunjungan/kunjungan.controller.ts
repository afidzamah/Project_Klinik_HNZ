import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { KunjunganService } from './kunjungan.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Kunjungan Pasien')
@Controller('kunjungan')
export class KunjunganController {
  constructor(private readonly kunjunganService: KunjunganService) {}

  @Post()
  create(@Body() createKunjunganDto: any) {
    return this.kunjunganService.create(createKunjunganDto);
  }

  // 🌟 JALUR BENAR: Rute 'tracking' HARUS ditulis LEBIH DULU daripada ':id'
  @Get('tracking')
  async dapatkanTrackingPasien() {
    return this.kunjunganService.findTracking();
  }

  @Get()
  findAll() {
    return this.kunjunganService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.kunjunganService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateKunjunganDto: any) {
    return this.kunjunganService.update(id, updateKunjunganDto);
  }
}