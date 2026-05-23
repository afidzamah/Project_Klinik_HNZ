import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MasterAsalRujukanService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.master_asal_rujukan.findMany({
      orderBy: {
        nama_asal_rujukan: 'asc',
      },
    });
  }
}
