import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJadwalDokterDto } from './dto/create-jadwal-dokter.dto';

@Injectable()
export class JadwalDokterService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateJadwalDokterDto) {
    return this.prisma.jadwal_dokter.create({
      data: {
        hari: dto.hari,
        id_poli: dto.id_poli,
        id_dokter: dto.id_dokter,
        jam_mulai: dto.jam_mulai,
        jam_selesai: dto.jam_selesai,
        kuota: Number(dto.kuota),
      },
      include: {
        master_poliklinik: true,
        master_dokter: true,
      },
    });
  }

  async findAll() {
    const schedules = await this.prisma.jadwal_dokter.findMany({
      include: {
        master_poliklinik: true,
        master_dokter: true,
      },
    });

    const dayWeight: Record<string, number> = {
      'Senin': 1,
      'Selasa': 2,
      'Rabu': 3,
      'Kamis': 4,
      'Jumat': 5,
      'Sabtu': 6,
      'Minggu': 7,
    };

    return schedules.sort((a, b) => {
      const weightA = dayWeight[a.hari] || 99;
      const weightB = dayWeight[b.hari] || 99;
      if (weightA !== weightB) {
        return weightA - weightB;
      }
      return a.jam_mulai.localeCompare(b.jam_mulai);
    });
  }

  async remove(id: string) {
    return this.prisma.jadwal_dokter.delete({
      where: { id_jadwal: id },
    });
  }
}
