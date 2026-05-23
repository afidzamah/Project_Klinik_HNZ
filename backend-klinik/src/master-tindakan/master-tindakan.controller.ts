import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { MasterTindakanService } from './master-tindakan.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Master Tindakan')
@Controller('master-tindakan')
export class MasterTindakanController {
  constructor(private readonly service: MasterTindakanService) {}

  @Get()
  @ApiOperation({ summary: 'Mendapatkan semua data tindakan' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mendapatkan data tindakan berdasarkan ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Menambahkan data tindakan baru' })
  create(@Body() dto: { nama_tindakan: string; kategori_tindakan: string; status_aktif?: boolean }) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Memperbarui data tindakan' })
  update(
    @Param('id') id: string,
    @Body() dto: { nama_tindakan?: string; kategori_tindakan?: string; status_aktif?: boolean },
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Menghapus data tindakan' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
