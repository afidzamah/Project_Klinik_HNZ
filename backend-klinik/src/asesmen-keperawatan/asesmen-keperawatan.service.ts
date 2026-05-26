import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AsesmenKeperawatanService {
  constructor(private prisma: PrismaService) {}

  // 1. Fungsi Perawat Menginput Asesmen Awal
  async create(createAsesmenDto: any) {
    // Memastikan data kunjungan pasien tersebut benar-benar ada
    const kunjungan = await this.prisma.kunjungan.findUnique({
      where: { id_kunjungan: createAsesmenDto.id_kunjungan },
    });

    if (!kunjungan) {
      throw new NotFoundException('Data kunjungan tidak ditemukan!');
    }

    // Menyimpan data asesmen TTV ke database
    return this.prisma.asesmen_keperawatan.create({
      data: {
        id_kunjungan: createAsesmenDto.id_kunjungan,
        // id_perawat: createAsesmenDto.id_perawat, // (Bisa diaktifkan jika tabel master perawat sudah ada)
        keluhan_utama: createAsesmenDto.keluhan_utama,
        sistole: createAsesmenDto.sistole,
        diastole: createAsesmenDto.diastole,
        suhu_tubuh: createAsesmenDto.suhu_tubuh,
        berat_badan: createAsesmenDto.berat_badan,
        tinggi_badan: createAsesmenDto.tinggi_badan,
        detak_jantung: createAsesmenDto.detak_jantung,
        respiratory_rate: createAsesmenDto.respiratory_rate,
        alergi_makanan: createAsesmenDto.alergi_makanan,
        alergi_obat: createAsesmenDto.alergi_obat,
        waktu_periksa: new Date(),
      },
    });
  }

  // 2. Fungsi Melihat Daftar Asesmen (Beserta Data Kunjungannya)
  async findAll() {
    return this.prisma.asesmen_keperawatan.findMany({
      include: {
        kunjungan: true, 
      },
    });
  }
}