import { Controller, Get, Param } from '@nestjs/common';
import { MasterWilayahService } from './master-wilayah.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Master Wilayah (Cascading)')
@Controller('master-wilayah') // Sama persis dengan URL fetch di frontend
export class MasterWilayahController {
  constructor(private readonly masterWilayahService: MasterWilayahService) {}

  @Get('jenis-alamat')
  getJenisAlamat() {
    return this.masterWilayahService.getJenisAlamat();
  }

  @Get('provinsi')
  getProvinsi() {
    return this.masterWilayahService.getProvinsi();
  }

  @Get('kabupaten/:id_provinsi')
  getKabupaten(@Param('id_provinsi') id_provinsi: string) {
    return this.masterWilayahService.getKabupaten(id_provinsi);
  }

  @Get('kecamatan/:id_kabupaten')
  getKecamatan(@Param('id_kabupaten') id_kabupaten: string) {
    return this.masterWilayahService.getKecamatan(id_kabupaten);
  }

  @Get('kelurahan/:id_kecamatan')
  getKelurahan(@Param('id_kecamatan') id_kecamatan: string) {
    return this.masterWilayahService.getKelurahan(id_kecamatan);
  }
}