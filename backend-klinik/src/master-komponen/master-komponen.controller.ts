import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { MasterKomponenService } from './master-komponen.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Master Komponen Tarif')
@Controller('master-komponen')
export class MasterKomponenController {
  constructor(private readonly service: MasterKomponenService) {}

  @Get()
  @ApiOperation({ summary: 'Mendapatkan semua data komponen tarif' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mendapatkan data komponen tarif berdasarkan ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Menambahkan data komponen tarif baru' })
  create(@Body() dto: { nama_komponen: string; keterangan?: string; status_aktif?: boolean }) {
    return this.service.create(dto);
  }
}
