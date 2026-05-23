import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MasterKomponenService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.master_komponen_tarif.findMany({
      orderBy: { nama_komponen: 'asc' },
    });
  }

  async findOne(id: string) {
    const komponen = await this.prisma.master_komponen_tarif.findUnique({
      where: { id_komponen: id },
    });
    if (!komponen) throw new NotFoundException('Komponen tidak ditemukan.');
    return komponen;
  }

  async create(dto: { nama_komponen: string; keterangan?: string; status_aktif?: boolean }) {
    return this.prisma.master_komponen_tarif.create({
      data: {
        nama_komponen: dto.nama_komponen,
        keterangan: dto.keterangan,
        status_aktif: dto.status_aktif !== undefined ? dto.status_aktif : true,
      },
    });
  }
}
