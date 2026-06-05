import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResepDto } from './dto/create-resep.dto';

const isValidUuid = (id: string) => {
  if (!id) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

@Injectable()
export class ResepService {
  constructor(private prisma: PrismaService) {}

  // 1. Fungsi Dokter Mengirim Resep ke Apotek
  async create(createResepDto: CreateResepDto) {
    // Memastikan kunjungannya valid
    const kunjungan = await this.prisma.kunjungan.findUnique({
      where: { id_kunjungan: createResepDto.id_kunjungan },
    });

    if (!kunjungan) {
      throw new NotFoundException('Data kunjungan tidak ditemukan!');
    }

    // Pastikan entri pemeriksaan_dokter (SOAP) sudah ada agar resep langsung muncul di Dashboard Farmasi
    const existingPemeriksaan = await this.prisma.pemeriksaan_dokter.findFirst({
      where: { id_kunjungan: createResepDto.id_kunjungan },
    });

    if (!existingPemeriksaan) {
      await this.prisma.pemeriksaan_dokter.create({
        data: {
          id_kunjungan: createResepDto.id_kunjungan,
          anamnesis_subjektif: 'Pemeriksaan Dokter (Resep Terkirim)',
          pemeriksaan_fisik_objektif: {},
          rencana_terapi_plan: '=== RESEP DIGITAL SAJA (SOAP MENYUSUL) ==='
        }
      });
    }

    const existingResep = await this.prisma.resep.findFirst({
      where: { id_kunjungan: createResepDto.id_kunjungan },
    });

    if (existingResep) {
      // Hapus item resep lama terlebih dahulu
      await this.prisma.resep_item.deleteMany({
        where: { id_resep: existingResep.id_resep },
      });

      // Update resep dengan resep_item baru
      return this.prisma.resep.update({
        where: { id_resep: existingResep.id_resep },
        data: {
          resep_item: {
            create: createResepDto.items.map((item) => {
              const isCustom = !isValidUuid(item.id_obat);
              return {
                id_obat: isCustom ? null : item.id_obat,
                nama_obat: item.nama_obat || null,
                jumlah: item.jumlah,
                aturan_pakai: item.aturan_pakai,
                catatan_tambahan: item.catatan_tambahan,
              };
            }),
          },
        },
        include: {
          resep_item: true,
        },
      });
    }

    // Membuat nomor resep otomatis (Contoh: R-HNZ-0001)
    const totalResep = await this.prisma.resep.count();
    const noResepOtomatis = `R-HNZ-${String(totalResep + 1).padStart(4, '0')}`;

    // AJAIB: Menyimpan ke tabel Resep (Header) sekaligus ke tabel Resep_Item (Detail)
    return this.prisma.resep.create({
      data: {
        id_kunjungan: createResepDto.id_kunjungan,
        no_resep: noResepOtomatis,
        status_resep: 'Terkirim', // Status awal masuk ke apotek
        
        // Memasukkan daftar obatnya ke tabel Resep_Item
        resep_item: {
          create: createResepDto.items.map((item) => {
            const isCustom = !isValidUuid(item.id_obat);
            return {
              id_obat: isCustom ? null : item.id_obat,
              nama_obat: item.nama_obat || null,
              jumlah: item.jumlah,
              aturan_pakai: item.aturan_pakai,
              catatan_tambahan: item.catatan_tambahan,
            };
          }),
        },
      },
      // Menginstruksikan Prisma untuk mengembalikan data lengkap beserta isi obatnya
      include: {
        resep_item: true, 
      },
    });
  }

  // 2. Fungsi Apoteker Melihat Daftar Resep yang Masuk
  async findAll() {
    return this.prisma.resep.findMany({
      include: {
        kunjungan: { include: { pasien: true } }, // Relasi ke Data Pasien
        resep_item: true, // Relasi ke Detail Obat
      },
      orderBy: {
        id_resep: 'desc', // Mengurutkan dari resep terbaru
      }
    });
  }

  // 3. Ambil Data Master Obat & Safety Checks untuk Dokter/Apotek
  async findMasterObat() {
    return this.prisma.master_obat_produk.findMany({
      include: {
        zat_aktif: true,
        obat_stok: true
      },
      where: {
        is_aktif: true
      }
    });
  }

  // Proses / Siapkan Obat (Pindahkan ke Pending)
  async proses(id_resep: string) {
    const resep = await this.prisma.resep.findUnique({
      where: { id_resep },
    });

    if (!resep) {
      throw new NotFoundException('Data resep tidak ditemukan!');
    }

    if (resep.status_resep === 'Selesai') {
      throw new Error('Resep ini sudah selesai diproses sebelumnya!');
    }

    return this.prisma.resep.update({
      where: { id_resep },
      data: { status_resep: 'Diproses' },
    });
  }

  // 4. Hapus / Batalkan Order Resep
  async remove(id: string) {
    // Hapus resep_item terlebih dahulu karena relasi FK
    await this.prisma.resep_item.deleteMany({
      where: { id_resep: id }
    });
    // Hapus header resep
    return this.prisma.resep.delete({
      where: { id_resep: id }
    });
  }

  // 5. Apoteker: Verifikasi & Serahkan Obat ke Pasien (Otomatis Masuk Billing Kasir)
  async serahkan(id_resep: string) {
    // A. Ambil data resep lengkap beserta detail obatnya
    const resep = await this.prisma.resep.findUnique({
      where: { id_resep },
      include: {
        kunjungan: {
          include: {
            pasien: true,
            cara_bayar: true,
          },
        },
        resep_item: {
          include: {
            master_obat: {
              include: {
                obat_harga: true,
              },
            },
          },
        },
      },
    });

    if (!resep) {
      throw new NotFoundException('Data resep tidak ditemukan!');
    }

    if (resep.status_resep === 'Selesai') {
      throw new Error('Resep ini sudah selesai diproses dan diserahkan sebelumnya!');
    }

    // B. Cari tagihan aktif (BELUM_BAYAR) untuk kunjungan ini
    const tagihan = await this.prisma.tagihan.findFirst({
      where: {
        id_kunjungan: resep.id_kunjungan,
        status_bayar: 'BELUM_BAYAR',
      },
    });

    if (!tagihan) {
      throw new NotFoundException(
        'Tagihan kasir aktif (BELUM_BAYAR) tidak ditemukan untuk kunjungan ini. Pastikan pasien sudah terdaftar dengan benar.'
      );
    }

    // C. Tentukan cara bayar (Umum / BPJS / Asuransi) untuk menyesuaikan harga obat
    const caraBayarName = resep.kunjungan?.cara_bayar?.nama_cara_bayar?.toLowerCase() || 'umum';
    let jaminanKey = 'umum';
    if (caraBayarName.includes('bpjs')) {
      jaminanKey = 'bpjs';
    } else if (caraBayarName.includes('asuransi')) {
      jaminanKey = 'asuransi_a';
    }

    let addedTotal = 0;
    const detailsToCreate: any[] = [];

    for (const item of resep.resep_item) {
      let hargaSatuan = 0;
      let namaObatBilling = item.nama_obat;

      if (item.id_obat && item.master_obat) {
        namaObatBilling = item.master_obat.nama_produk_lengkap;
        
        // Cari harga obat berdasarkan jaminan pasien, fallback ke umum
        const matchingPrice = 
          item.master_obat.obat_harga.find((hp) => hp.jenis_jaminan === jaminanKey) ||
          item.master_obat.obat_harga.find((hp) => hp.jenis_jaminan === 'umum') ||
          item.master_obat.obat_harga[0];

        hargaSatuan = matchingPrice ? Number(matchingPrice.harga_satuan) : 0;
      } else {
        // Fallback untuk Puyer Racikan / Custom-Racikan (Flat Rp 15.000 per sediaan racikan)
        hargaSatuan = 15000;
        if (!namaObatBilling) {
          namaObatBilling = item.catatan_tambahan?.includes('Puyer') || item.aturan_pakai?.includes('bungkus') 
            ? 'R/ Puyer Racikan Custom' 
            : 'Obat Racikan Khusus';
        }
      }

      const subtotal = hargaSatuan * item.jumlah;
      addedTotal += subtotal;

      detailsToCreate.push({
        id_tagihan: tagihan.id_tagihan,
        id_resep_item: item.id_resep_item,
        item_layanan: `Obat: ${namaObatBilling}`,
        kategori_biaya: 'Obat',
        harga_satuan: hargaSatuan,
        kuantitas: item.jumlah,
        subtotal: subtotal,
      });
    }

    // E. Jalankan transaksi database (Prisma Transaction) agar konsisten
    return this.prisma.$transaction(async (tx) => {
      // 1. Masukkan seluruh rincian obat ke tagihan_detail
      for (const det of detailsToCreate) {
        await tx.tagihan_detail.create({
          data: {
            id_tagihan: det.id_tagihan,
            id_resep_item: det.id_resep_item,
            item_layanan: det.item_layanan,
            kategori_biaya: det.kategori_biaya,
            harga_satuan: det.harga_satuan,
            kuantitas: det.kuantitas,
            subtotal: det.subtotal,
          },
        });
      }

      // 2. Update nominal bruto dan netto pada tagihan (Header)
      const newBruto = Number(tagihan.total_bruto) + addedTotal;
      const newNetto = Number(tagihan.total_netto) + addedTotal;

      await tx.tagihan.update({
        where: { id_tagihan: tagihan.id_tagihan },
        data: {
          total_bruto: newBruto,
          total_netto: newNetto,
        },
      });

      // 3. Ubah status resep di apotek menjadi 'Selesai' (Telah diserahkan)
      const updatedResep = await tx.resep.update({
        where: { id_resep },
        data: {
          status_resep: 'Selesai',
        },
      });

      console.log(`✅ Sukses memposting resep ${resep.no_resep} ke billing ${tagihan.no_invoice} (Total Tambahan: Rp ${addedTotal})`);

      return {
        success: true,
        message: 'Resep berhasil diserahkan dan diposting ke billing kasir!',
        addedTotal,
        newBruto,
        newNetto,
        status_resep: 'Selesai',
      };
    });
  }
}