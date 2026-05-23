import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MasterHargaTindakanService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.master_harga_tindakan.findMany({
      include: {
        master_tindakan: true,
        master_kelas: true,
        master_cara_bayar: true,
        master_harga_tindakan_komponen: {
          include: {
            master_komponen_tarif: true,
          },
        },
      },
      orderBy: {
        master_tindakan: {
          nama_tindakan: 'asc',
        },
      },
    });
  }

  async findOne(id: string) {
    const harga = await this.prisma.master_harga_tindakan.findUnique({
      where: { id_harga: id },
      include: {
        master_tindakan: true,
        master_kelas: true,
        master_cara_bayar: true,
        master_harga_tindakan_komponen: {
          include: {
            master_komponen_tarif: true,
          },
        },
      },
    });
    if (!harga) throw new NotFoundException('Tarif tindakan tidak ditemukan.');
    return harga;
  }

  async save(dto: {
    id_tindakan: string;
    id_kelas: string;
    id_cara_bayar: string;
    status_aktif?: boolean;
    komponen_tarif: { id_komponen: string; nilai_tarif: number }[];
  }) {
    // 1. Hitung total_tarif dari seluruh komponen
    const totalTarif = dto.komponen_tarif.reduce((sum, item) => sum + item.nilai_tarif, 0);

    // 2. Gunakan Prisma Transaction untuk menjamin ACID
    return this.prisma.$transaction(async (tx) => {
      // 2.1 Upsert header tarif
      const header = await tx.master_harga_tindakan.upsert({
        where: {
          id_tindakan_id_kelas_id_cara_bayar: {
            id_tindakan: dto.id_tindakan,
            id_kelas: dto.id_kelas,
            id_cara_bayar: dto.id_cara_bayar,
          },
        },
        update: {
          total_tarif: totalTarif,
          status_aktif: dto.status_aktif !== undefined ? dto.status_aktif : true,
          updated_at: new Date(),
        },
        create: {
          id_tindakan: dto.id_tindakan,
          id_kelas: dto.id_kelas,
          id_cara_bayar: dto.id_cara_bayar,
          total_tarif: totalTarif,
          status_aktif: dto.status_aktif !== undefined ? dto.status_aktif : true,
        },
      });

      // 2.2 Hapus komponen detail lama
      await tx.master_harga_tindakan_komponen.deleteMany({
        where: { id_harga: header.id_harga },
      });

      // 2.3 Simpan komponen detail baru
      if (dto.komponen_tarif && dto.komponen_tarif.length > 0) {
        await tx.master_harga_tindakan_komponen.createMany({
          data: dto.komponen_tarif.map((item) => ({
            id_harga: header.id_harga,
            id_komponen: item.id_komponen,
            nilai_tarif: item.nilai_tarif,
          })),
        });
      }

      return header;
    });
  }

  async remove(id: string) {
    const harga = await this.findOne(id);
    return this.prisma.master_harga_tindakan.delete({
      where: { id_harga: harga.id_harga },
    });
  }
}
