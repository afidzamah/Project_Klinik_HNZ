import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { MasterHargaTindakanService } from './master-harga-tindakan.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Tarif & Harga Tindakan')
@Controller('master-harga-tindakan')
export class MasterHargaTindakanController {
  constructor(private readonly service: MasterHargaTindakanService) {}

  @Get()
  @ApiOperation({ summary: 'Mendapatkan semua data tarif tindakan beserta breakdown komponen' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mendapatkan data tarif tindakan berdasarkan ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Menyimpan atau memperbarui data tarif tindakan (Header + Detail)' })
  save(
    @Body()
    dto: {
      id_tindakan: string;
      id_kelas: string;
      id_cara_bayar: string;
      status_aktif?: boolean;
      komponen_tarif: { id_komponen: string; nilai_tarif: number }[];
    },
  ) {
    return this.service.save(dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Menghapus data tarif tindakan' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
