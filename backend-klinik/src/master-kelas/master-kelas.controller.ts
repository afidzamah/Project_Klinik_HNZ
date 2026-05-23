import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { MasterKelasService } from './master-kelas.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Master Kelas')
@Controller('master-kelas')
export class MasterKelasController {
  constructor(private readonly service: MasterKelasService) {}

  @Get()
  @ApiOperation({ summary: 'Mendapatkan semua data kelas' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mendapatkan data kelas berdasarkan ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Menambahkan data kelas baru' })
  create(@Body() dto: { nama_kelas: string; status_aktif?: boolean }) {
    return this.service.create(dto);
  }
}
