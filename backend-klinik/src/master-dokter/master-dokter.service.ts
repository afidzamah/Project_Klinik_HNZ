import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MasterDokterService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    // 1. Dapatkan nama hari saat ini dalam Bahasa Indonesia
    const indonesianDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayDayName = indonesianDays[new Date().getDay()];

    // 2. Ambil batas waktu hari ini (00:00:00 s.d 23:59:59)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 3. Ambil data dokter beserta poliklinik dan jadwal hari ini
    const doctors = await this.prisma.master_dokter.findMany({
      where: { status_aktif: true },
      include: {
        master_poliklinik: true,
        jadwal_dokter: {
          where: { hari: todayDayName },
        },
      },
    });

    // 4. Hitung statistik antrean secara realtime untuk masing-masing dokter
    const resolvedDoctors = await Promise.all(
      doctors.map(async (doc) => {
        // Ambil semua kunjungan terdaftar hari ini untuk dokter ini (termasuk yang berstatus null)
        const visitsToday = await this.prisma.kunjungan.findMany({
          where: {
            id_dokter: doc.id_dokter,
            created_at: {
              gte: startOfToday,
              lte: endOfToday,
            },
          },
        });

        // Filter aktif secara aman di memori (mengabaikan yang Batal, menyertakan status null)
        const activeVisits = visitsToday.filter(v => v.status_kunjungan !== 'Batal');
        const terdaftar = activeVisits.length;

        // Hitung pasien yang belum dilayani (status bukan Selesai dan bukan Batal)
        const belum_dilayani = activeVisits.filter(
          (v) => v.status_kunjungan !== 'Selesai'
        ).length;

        // Tentukan kuota dari jadwal, fallback 20 jika jadwal tidak tersedia hari ini
        const scheduleToday = doc.jadwal_dokter?.[0];
        const kuota = scheduleToday?.kuota || 20;

        const sisa_slot = Math.max(0, kuota - terdaftar);

        return {
          ...doc,
          kuota,
          terdaftar,
          belum_dilayani,
          sisa_slot,
        };
      })
    );

    return resolvedDoctors;
  }
}