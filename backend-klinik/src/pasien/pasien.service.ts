import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PasienService {
  // Memanggil database dari PrismaService
  constructor(private prisma: PrismaService) {}

  // 1. Fungsi untuk mendaftarkan pasien baru
  async create(createPasienDto: any) {
    // Mengecek apakah NIK sudah pernah didaftarkan sebelumnya
    const pasienExist = await this.prisma.pasien.findUnique({
      where: { nik: createPasienDto.nik },
    });

    if (pasienExist) {
      throw new ConflictException('Pasien dengan NIK tersebut sudah terdaftar di Klinik HNZ!');
    }

    // Membuat Nomor Rekam Medis (RM) otomatis (contoh: RM-HNZ-0001)
    const totalPasien = await this.prisma.pasien.count();
    const noRmOtomatis = `RM-HNZ-${String(totalPasien + 1).padStart(4, '0')}`;

    // Memasukkan data ke tabel Pasien
    return this.prisma.pasien.create({
      data: {
        no_rm: noRmOtomatis,
        nik: createPasienDto.nik,
        nama_lengkap: createPasienDto.nama_lengkap,
        tgl_lahir: new Date(createPasienDto.tgl_lahir), // Memastikan format tanggal valid
        jenis_kelamin: createPasienDto.jenis_kelamin,
        agama: createPasienDto.agama,
        pekerjaan: createPasienDto.pekerjaan,
        no_kontak: createPasienDto.no_kontak,
      },
    });
  }

  // 2. Fungsi untuk melihat seluruh data pasien
  async findAll() {
    return this.prisma.pasien.findMany();
  }
}