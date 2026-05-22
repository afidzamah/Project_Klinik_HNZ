import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MasterWilayahService {
  constructor(private prisma: PrismaService) {}

  async getJenisAlamat() {
    return this.prisma.master_jenis_alamat.findMany();
  }

  async getProvinsi() {
    return this.prisma.master_provinsi.findMany({
      orderBy: { nama_provinsi: 'asc' }, // Urutkan abjad A-Z
    });
  }

  async getKabupaten(id_provinsi: string) {
    return this.prisma.master_kabupaten.findMany({
      where: { id_provinsi: id_provinsi },
      orderBy: { nama_kabupaten: 'asc' },
    });
  }

  async getKecamatan(id_kabupaten: string) {
    return this.prisma.master_kecamatan.findMany({
      where: { id_kabupaten: id_kabupaten },
      orderBy: { nama_kecamatan: 'asc' },
    });
  }

  async getKelurahan(id_kecamatan: string) {
    return this.prisma.master_kelurahan.findMany({
      where: { id_kecamatan: id_kecamatan },
      orderBy: { nama_kelurahan: 'asc' },
    });
  }
}