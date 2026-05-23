import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AntreanService {
  constructor(private prisma: PrismaService) {}

  async create(createAntreanDto: any) {
    const { tipe_antrean, id_kunjungan } = createAntreanDto;

    // 1. Logika Cerdas: Men-generate Nomor Antrean Otomatis
    // Ambil tanggal hari ini mulai dari jam 00:00:00
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Hitung sudah ada berapa antrean hari ini dengan tipe yang sama
    const jumlahAntreanHariIni = await this.prisma.antrean.count({
      where: {
        tipe_antrean: tipe_antrean,
        created_at: {
          gte: today, // Hitung yang dibuat hari ini saja
        },
      },
    });

    // Buat nomor urut baru (misal: 001, 002, 003)
    const nomorUrut = (jumlahAntreanHariIni + 1).toString().padStart(3, '0');
    
    // Tentukan kode awalan dinamis dari database
    let settingKey = 'prefix_antrean_pendaftaran';
    let fallbackPrefix = 'L';

    if (tipe_antrean === 'Nurse') {
      settingKey = 'prefix_antrean_nurse';
      fallbackPrefix = 'N';
    } else if (tipe_antrean === 'Poli') {
      settingKey = 'prefix_antrean_dokter';
      fallbackPrefix = 'P';
    }

    const setting = await this.prisma.pengaturan_aplikasi.findUnique({
      where: { kunci: settingKey }
    });

    const kodePrefix = (setting?.nilai || fallbackPrefix).toUpperCase(); 
    const no_antrean_baru = `${kodePrefix}-${nomorUrut}`;

    // 2. Eksekusi Simpan ke Database PostgreSQL via Prisma
    const antreanBaru = await this.prisma.antrean.create({
      data: {
        no_antrean: no_antrean_baru,
        tipe_antrean: tipe_antrean,
        status_panggil: 'Tunggu', // Status default saat baru daftar
        jumlah_panggil: 0,        // Belum pernah dipanggil
        id_kunjungan: id_kunjungan,
      },
    });

    // Kembalikan data antrean baru ke frontend agar layar langsung update
    return antreanBaru;
  }
  async update(id_antrean: string, updateAntreanDto: any) {
    return this.prisma.antrean.update({
      where: { id_antrean }, // Mengunci data berdasarkan ID UUID antrean
      data: {
        status_panggil: updateAntreanDto.status_panggil,
        // Otomatis naikkan jumlah panggil setiap kali tombol diklik
        jumlah_panggil: updateAntreanDto.status_panggil === 'Panggil' ? { increment: 1 } : undefined
      },
    });
  }

  // Sekarang orderBy created_at dijamin 100% aman dan bebas eror validation
  async findAll() {
    return this.prisma.antrean.findMany({
      include: {
        kunjungan: {
          include: {
            pasien: {
              include: {
                jenis_alamat: true,
                provinsi: true,
                kabupaten: true,
                kecamatan: true,
                kelurahan: true,
              },
            },
            asesmen_keperawatan: true,
          },
        },
      },
      orderBy: {
        created_at: 'asc',
      },
    });
  }
}