import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MasterDokterService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.master_dokter.findMany({
      where: { status_aktif: true },
    });
  }
}