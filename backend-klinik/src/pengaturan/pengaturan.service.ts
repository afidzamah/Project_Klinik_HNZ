import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SavePengaturanDto } from './dto/create-pengaturan.dto';

@Injectable()
export class PengaturanService {
  constructor(private prisma: PrismaService) {}

  async upsertSetting(dto: SavePengaturanDto) {
    return this.prisma.pengaturan_aplikasi.upsert({
      where: { kunci: dto.kunci },
      update: {
        nilai: dto.nilai,
        keterangan: dto.keterangan,
        updated_at: new Date(),
      },
      create: {
        kunci: dto.kunci,
        nilai: dto.nilai,
        keterangan: dto.keterangan,
      },
    });
  }

  async findMany() {
    return this.prisma.pengaturan_aplikasi.findMany({
      orderBy: { kunci: 'asc' },
    });
  }

  async findByKunci(kunci: string) {
    const setting = await this.prisma.pengaturan_aplikasi.findUnique({
      where: { kunci },
    });

    if (!setting) {
      throw new NotFoundException(`Pengaturan dengan kunci '${kunci}' tidak ditemukan.`);
    }

    return setting;
  }
}
