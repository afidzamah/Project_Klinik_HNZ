import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JadwalDokterService } from './jadwal-dokter.service';
import { CreateJadwalDokterDto } from './dto/create-jadwal-dokter.dto';

@ApiTags('Jadwal Dokter')
@Controller('jadwal-dokter')
export class JadwalDokterController {
  constructor(private readonly jadwalDokterService: JadwalDokterService) {}

  @Post()
  @ApiOperation({ summary: 'Buat Jadwal Praktek Dokter Baru' })
  create(@Body() createDto: CreateJadwalDokterDto) {
    return this.jadwalDokterService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Ambil Semua Jadwal Praktek Dokter' })
  findAll() {
    return this.jadwalDokterService.findAll();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus Jadwal Praktek Dokter' })
  remove(@Param('id') id: string) {
    return this.jadwalDokterService.remove(id);
  }
}
