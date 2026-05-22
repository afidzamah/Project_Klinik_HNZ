import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagihanDto } from './dto/create-tagihan.dto';

@Injectable()
export class TagihanService {
  constructor(private prisma: PrismaService) {}

  // 1. Fungsi Kasir Membuat Tagihan Akhir
  async create(createTagihanDto: CreateTagihanDto) {
    // Memastikan kunjungannya valid
    const kunjungan = await this.prisma.kunjungan.findUnique({
      where: { id_kunjungan: createTagihanDto.id_kunjungan },
    });

    if (!kunjungan) {
      throw new NotFoundException('Data kunjungan tidak ditemukan!');
    }

    // Membuat nomor invoice otomatis (Contoh: INV-HNZ-0001)
    const totalTagihan = await this.prisma.tagihan.count();
    const noInvoiceOtomatis = `INV-HNZ-${String(totalTagihan + 1).padStart(4, '0')}`;

    // AJAIB: Menyimpan ke tabel Tagihan (Header) sekaligus ke tabel Tagihan_Detail
    const tagihanBaru = await this.prisma.tagihan.create({
      data: {
        id_kunjungan: createTagihanDto.id_kunjungan,
        no_invoice: noInvoiceOtomatis,
        total_bruto: createTagihanDto.total_bruto,
        total_diskon: createTagihanDto.total_diskon,
        total_netto: createTagihanDto.total_netto,
        metode_pembayaran: createTagihanDto.metode_pembayaran,
        status_bayar: 'Lunas', // Otomatis lunas saat diinput
        waktu_bayar: new Date(),
        
        // Memasukkan rincian biayanya ke tabel Tagihan_Detail
        tagihan_detail: {
          create: createTagihanDto.items.map((item) => ({
            item_layanan: item.item_layanan,
            kategori_biaya: item.kategori_biaya,
            harga_satuan: item.harga_satuan,
            kuantitas: item.kuantitas,
            subtotal: item.subtotal,
          })),
        },
      },
      include: {
        tagihan_detail: true, 
      },
    });

    // Otomatis mengubah status Kunjungan menjadi "Selesai" setelah dibayar
    await this.prisma.kunjungan.update({
      where: { id_kunjungan: createTagihanDto.id_kunjungan },
      data: { status_kunjungan: 'Selesai' },
    });

    return tagihanBaru;
  }

  // 2. Fungsi Melihat Daftar Transaksi Kasir
  async findAll() {
    return this.prisma.tagihan.findMany({
      include: {
        kunjungan: { include: { pasien: true } }, 
        tagihan_detail: true, 
      },
      orderBy: {
        id_tagihan: 'desc', 
      }
    });
  }
}