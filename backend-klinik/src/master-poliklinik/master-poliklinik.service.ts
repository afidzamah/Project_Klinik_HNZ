import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MasterPoliklinikService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.master_poliklinik.findMany({
      orderBy: { nama_poli: 'asc' },
    });
  }
}