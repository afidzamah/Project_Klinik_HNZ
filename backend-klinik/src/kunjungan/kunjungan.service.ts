import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KunjunganService {
  constructor(private prisma: PrismaService) {}

  async create(createKunjunganDto: any) {
    // 1. Ambil batasan waktu hari ini (00:00:00 sampai 23:59:59)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 2. Hitung berapa jumlah kunjungan yang sudah tersimpan HARI INI
    const countToday = await this.prisma.kunjungan.count({
      where: {
        created_at: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    // 3. Ambil data tanggal saat ini untuk komponen YY, MM, DD
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2); // Mengambil 2 digit terakhir tahun (cth: 26)
    const mm = String(now.getMonth() + 1).padStart(2, '0'); // Bulan berformat 2 digit (cth: 05)
    const dd = String(now.getDate()).padStart(2, '0'); // Tanggal berformat 2 digit (cth: 18)
    
    // 4. Buat 4 digit sequence otomatis yang naik 1 angka (cth: 0001, 0002)
    const xxxx = String(countToday + 1).padStart(4, '0');

    // 5. Gabungkan menjadi format YYMMDDXXXX
    const no_kunjungan = `${yy}${mm}${dd}${xxxx}`;

    // 6. Simpan transaksi ke database bersama nomor kunjungan baru
    return this.prisma.kunjungan.create({
      data: {
        ...createKunjunganDto,
        no_kunjungan: no_kunjungan,
      },
    });
  }

  // Fungsi lainnya tetap dibiarkan utuh aman
  async findAll() {
    return this.prisma.kunjungan.findMany({
      include: { pasien: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.kunjungan.findUnique({
      where: { id_kunjungan: id },
      include: { pasien: true },
    });
  }

  async findTracking() {
    return this.prisma.kunjungan.findMany({
      include: {
        pasien: true,
        antrean: true,
        asesmen_keperawatan: true,
        pemeriksaan_dokter: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }
}