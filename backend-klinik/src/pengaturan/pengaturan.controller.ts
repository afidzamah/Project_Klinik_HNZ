import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PengaturanService } from './pengaturan.service';
import { SavePengaturanDto } from './dto/create-pengaturan.dto';

@ApiTags('Pengaturan Aplikasi')
@Controller('pengaturan')
export class PengaturanController {
  constructor(private readonly pengaturanService: PengaturanService) {}

  @Post()
  @ApiOperation({ summary: 'Simpan atau Perbarui Pengaturan Aplikasi' })
  upsert(@Body() dto: SavePengaturanDto) {
    return this.pengaturanService.upsertSetting(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Ambil Semua Pengaturan Aplikasi' })
  findAll() {
    return this.pengaturanService.findMany();
  }

  @Get(':kunci')
  @ApiOperation({ summary: 'Ambil Satu Pengaturan berdasarkan Kunci' })
  findOne(@Param('kunci') kunci: string) {
    return this.pengaturanService.findByKunci(kunci);
  }
}
