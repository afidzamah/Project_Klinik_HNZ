import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MasterKelasService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.master_kelas.findMany({
      orderBy: { nama_kelas: 'asc' },
    });
  }

  async findOne(id: string) {
    const kelas = await this.prisma.master_kelas.findUnique({
      where: { id_kelas: id },
    });
    if (!kelas) throw new NotFoundException('Kelas tidak ditemukan.');
    return kelas;
  }

  async create(dto: { nama_kelas: string; status_aktif?: boolean }) {
    return this.prisma.master_kelas.create({
      data: {
        nama_kelas: dto.nama_kelas,
        status_aktif: dto.status_aktif !== undefined ? dto.status_aktif : true,
      },
    });
  }
}
