import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResepDto } from './dto/create-resep.dto';

@Injectable()
export class ResepService {
  constructor(private prisma: PrismaService) {}

  // 1. Fungsi Dokter Mengirim Resep ke Apotek
  async create(createResepDto: CreateResepDto) {
    // Memastikan kunjungannya valid
    const kunjungan = await this.prisma.kunjungan.findUnique({
      where: { id_kunjungan: createResepDto.id_kunjungan },
    });

    if (!kunjungan) {
      throw new NotFoundException('Data kunjungan tidak ditemukan!');
    }

    // Membuat nomor resep otomatis (Contoh: R-HNZ-0001)
    const totalResep = await this.prisma.resep.count();
    const noResepOtomatis = `R-HNZ-${String(totalResep + 1).padStart(4, '0')}`;

    // AJAIB: Menyimpan ke tabel Resep (Header) sekaligus ke tabel Resep_Item (Detail)
    return this.prisma.resep.create({
      data: {
        id_kunjungan: createResepDto.id_kunjungan,
        no_resep: noResepOtomatis,
        status_resep: 'Terkirim', // Status awal masuk ke apotek
        
        // Memasukkan daftar obatnya ke tabel Resep_Item
        resep_item: {
          create: createResepDto.items.map((item) => ({
            id_obat: item.id_obat,
            jumlah: item.jumlah,
            aturan_pakai: item.aturan_pakai,
            catatan_tambahan: item.catatan_tambahan,
          })),
        },
      },
      // Menginstruksikan Prisma untuk mengembalikan data lengkap beserta isi obatnya
      include: {
        resep_item: true, 
      },
    });
  }

  // 2. Fungsi Apoteker Melihat Daftar Resep yang Masuk
  async findAll() {
    return this.prisma.resep.findMany({
      include: {
        kunjungan: { include: { pasien: true } }, // Relasi ke Data Pasien
        resep_item: true, // Relasi ke Detail Obat
      },
      orderBy: {
        id_resep: 'desc', // Mengurutkan dari resep terbaru
      }
    });
  }
}