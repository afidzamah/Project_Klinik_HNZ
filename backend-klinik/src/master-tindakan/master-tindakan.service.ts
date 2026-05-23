import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MasterTindakanService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.master_tindakan.findMany({
      orderBy: { nama_tindakan: 'asc' },
    });
  }

  async findOne(id: string) {
    const tindakan = await this.prisma.master_tindakan.findUnique({
      where: { id_tindakan: id },
    });
    if (!tindakan) throw new NotFoundException('Tindakan tidak ditemukan.');
    return tindakan;
  }

  async create(dto: { nama_tindakan: string; kategori_tindakan: string; status_aktif?: boolean }) {
    return this.prisma.master_tindakan.create({
      data: {
        nama_tindakan: dto.nama_tindakan,
        kategori_tindakan: dto.kategori_tindakan,
        status_aktif: dto.status_aktif !== undefined ? dto.status_aktif : true,
      },
    });
  }

  async update(id: string, dto: { nama_tindakan?: string; kategori_tindakan?: string; status_aktif?: boolean }) {
    await this.findOne(id);
    return this.prisma.master_tindakan.update({
      where: { id_tindakan: id },
      data: {
        nama_tindakan: dto.nama_tindakan,
        kategori_tindakan: dto.kategori_tindakan,
        status_aktif: dto.status_aktif,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.master_tindakan.delete({
      where: { id_tindakan: id },
    });
  }
}
