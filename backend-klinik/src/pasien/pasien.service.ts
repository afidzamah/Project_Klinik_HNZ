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

    // Memasukkan data ke tabel Pasien beserta data alamat cascading
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
        id_jenis_alamat: createPasienDto.id_jenis_alamat || null,
        rt_rw: createPasienDto.rt_rw || null,
        id_provinsi: createPasienDto.id_provinsi || null,
        id_kabupaten: createPasienDto.id_kabupaten || null,
        id_kecamatan: createPasienDto.id_kecamatan || null,
        id_kelurahan: createPasienDto.id_kelurahan || null,
        alamat_lengkap: createPasienDto.alamat_lengkap || null,
      },
    });
  }

  // 2. Fungsi untuk melihat seluruh data pasien beserta detail alamat lengkapnya
  async findAll() {
    return this.prisma.pasien.findMany({
      include: {
        jenis_alamat: true,
        provinsi: true,
        kabupaten: true,
        kecamatan: true,
        kelurahan: true,
      },
    });
  }

  // Fungsi untuk mencari data pasien berdasarkan NIK beserta riwayat kunjungan terakhirnya
  async findByNik(nik: string) {
    const pasien = await this.prisma.pasien.findUnique({
      where: { nik },
      include: {
        jenis_alamat: true,
        provinsi: true,
        kabupaten: true,
        kecamatan: true,
        kelurahan: true,
        kunjungan: {
          take: 5,
          orderBy: {
            created_at: 'desc',
          },
          include: {
            cara_bayar: true,
          },
        },
      },
    });

    if (!pasien) return null;

    // Resolusikan nama poliklinik dan nama dokter secara dinamis untuk riwayat kunjungan
    const visitsWithDetails = await Promise.all(
      pasien.kunjungan.map(async (visit) => {
        let poliName = 'Poliklinik';
        let dokterName = 'Dokter';

        if (visit.id_poli) {
          const poli = await this.prisma.master_poliklinik.findUnique({
            where: { id_poli: visit.id_poli },
          });
          if (poli) poliName = poli.nama_poli;
        }

        if (visit.id_dokter) {
          const dokter = await this.prisma.master_dokter.findUnique({
            where: { id_dokter: visit.id_dokter },
          });
          if (dokter) dokterName = dokter.nama_dokter;
        }

        return {
          ...visit,
          nama_poli: poliName,
          nama_dokter: dokterName,
        };
      }),
    );

    return {
      ...pasien,
      kunjungan: visitsWithDetails,
    };
  }

  // 3. Fungsi untuk memperbarui data pasien (RM dilarang berubah)
  async update(id: string, updatePasienDto: any) {
    const pasien = await this.prisma.pasien.findUnique({
      where: { id_pasien: id },
    });
    if (!pasien) {
      throw new ConflictException('Pasien tidak ditemukan!');
    }

    // Mengabaikan no_rm, id_pasien dan created_at agar tidak bisa diganti
    const { no_rm, id_pasien, created_at, ...updateData } = updatePasienDto;

    // Normalisasi nilai string kosong ("") menjadi null agar tidak melanggar aturan foreign key / tipe data UUID
    const sanitizedData: any = {};
    for (const key in updateData) {
      if (updateData.hasOwnProperty(key)) {
        const val = updateData[key];
        if (
          [
            'id_jenis_alamat',
            'id_provinsi',
            'id_kabupaten',
            'id_kecamatan',
            'id_kelurahan',
            'rt_rw',
            'alamat_lengkap',
          ].includes(key)
        ) {
          sanitizedData[key] = val === '' ? null : val;
        } else {
          sanitizedData[key] = val;
        }
      }
    }

    return this.prisma.pasien.update({
      where: { id_pasien: id },
      data: {
        ...sanitizedData,
        tgl_lahir: sanitizedData.tgl_lahir ? new Date(sanitizedData.tgl_lahir) : undefined,
      },
      include: {
        jenis_alamat: true,
        provinsi: true,
        kabupaten: true,
        kecamatan: true,
        kelurahan: true,
      },
    });
  }
}