import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MasterCaraBayarService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.master_cara_bayar.findMany({
      include: {
        penjamin: {
          orderBy: {
            nama_penjamin: 'asc',
          },
        },
      },
      orderBy: {
        nama_cara_bayar: 'asc',
      },
    });
  }
}
