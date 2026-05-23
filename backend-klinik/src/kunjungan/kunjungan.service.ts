import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KunjunganService {
  constructor(private prisma: PrismaService) {}

  async create(createKunjunganDto: any) {
    // 1. Ambil batasan waktu hari ini (00:00:00 sampai 23:59:59)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 2. Hitung berapa jumlah kunjungan yang sudah tersimpan HARI INI
    const countToday = await this.prisma.kunjungan.count({
      where: {
        created_at: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    // 3. Ambil data tanggal saat ini untuk komponen YY, MM, DD
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2); // Mengambil 2 digit terakhir tahun (cth: 26)
    const mm = String(now.getMonth() + 1).padStart(2, '0'); // Bulan berformat 2 digit (cth: 05)
    const dd = String(now.getDate()).padStart(2, '0'); // Tanggal berformat 2 digit (cth: 18)
    
    // 4. Buat 4 digit sequence otomatis yang naik 1 angka (cth: 0001, 0002)
    const xxxx = String(countToday + 1).padStart(4, '0');

    // 5. Gabungkan menjadi format YYMMDDXXXX
    const no_kunjungan = `${yy}${mm}${dd}${xxxx}`;

    // 6. Simpan transaksi secara transaksional bersama invoice billing otomatis
    return this.prisma.$transaction(async (tx) => {
      // Simpan kunjungan utama
      const newKunjungan = await tx.kunjungan.create({
        data: {
          ...createKunjunganDto,
          no_kunjungan: no_kunjungan,
        },
      });

      try {
        // Otomatisasi Billing Administrasi Pendaftaran
        const adminAction = await tx.master_tindakan.findFirst({
          where: { nama_tindakan: 'Administrasi Pendaftaran', status_aktif: true },
        });

        const rawatJalanKelas = await tx.master_kelas.findFirst({
          where: { nama_kelas: 'Rawat Jalan', status_aktif: true },
        });

        if (adminAction && rawatJalanKelas) {
          // Cari nama cara bayar aktif
          let activeCaraBayarName = 'Umum Pribadi';
          if (newKunjungan.id_cara_bayar) {
            const cb = await tx.master_cara_bayar.findUnique({
              where: { id_cara_bayar: newKunjungan.id_cara_bayar },
            });
            if (cb) activeCaraBayarName = cb.nama_cara_bayar;
          }

          let rateHeader: any = null;
          if (newKunjungan.id_cara_bayar) {
            rateHeader = await tx.master_harga_tindakan.findFirst({
              where: {
                id_tindakan: adminAction.id_tindakan,
                id_kelas: rawatJalanKelas.id_kelas,
                id_cara_bayar: newKunjungan.id_cara_bayar,
                status_aktif: true,
              },
              include: {
                master_harga_tindakan_komponen: {
                  include: {
                    master_komponen_tarif: true,
                  },
                },
              },
            });
          }

          if (!rateHeader) {
            // Fallback ke Cara Bayar default (Umum Pribadi)
            const defaultCaraBayar = await tx.master_cara_bayar.findFirst({
              where: { nama_cara_bayar: 'Umum Pribadi' },
            });

            if (defaultCaraBayar) {
              rateHeader = await tx.master_harga_tindakan.findFirst({
                where: {
                  id_tindakan: adminAction.id_tindakan,
                  id_kelas: rawatJalanKelas.id_kelas,
                  id_cara_bayar: defaultCaraBayar.id_cara_bayar,
                  status_aktif: true,
                },
                include: {
                  master_harga_tindakan_komponen: {
                    include: {
                      master_komponen_tarif: true,
                    },
                  },
                },
              });
            }
          }

          if (rateHeader) {
            const totalTarif = rateHeader.total_tarif;

            // A. Buat tagihan (Header)
            const newTagihan = await tx.tagihan.create({
              data: {
                id_kunjungan: newKunjungan.id_kunjungan,
                no_invoice: 'INV-' + no_kunjungan,
                total_bruto: totalTarif,
                total_diskon: 0,
                total_netto: totalTarif,
                status_bayar: 'BELUM_BAYAR',
                metode_pembayaran: activeCaraBayarName,
              },
            });

            // B. Buat tagihan_detail (Item Tindakan)
            const newDetail = await tx.tagihan_detail.create({
              data: {
                id_tagihan: newTagihan.id_tagihan,
                id_tindakan: adminAction.id_tindakan,
                item_layanan: adminAction.nama_tindakan,
                kategori_biaya: 'Administrasi',
                harga_satuan: totalTarif,
                kuantitas: 1,
                subtotal: totalTarif,
              },
            });

            // C. Buat tagihan_detail_komponen (Pecahan Snapshot Komponen)
            for (const componentRate of rateHeader.master_harga_tindakan_komponen) {
              await tx.tagihan_detail_komponen.create({
                data: {
                  id_tagihan_detail: newDetail.id_tagihan_detail,
                  id_komponen: componentRate.id_komponen,
                  nama_komponen: componentRate.master_komponen_tarif.nama_komponen,
                  nilai_tarif: componentRate.nilai_tarif,
                },
              });
            }
            console.log(`✅ Auto-billed Administrasi Pendaftaran (Rp ${totalTarif}) for patient visit ${no_kunjungan}`);
          }
        }
      } catch (billingError) {
        console.error('❌ Error during pendaftaran auto-billing: ', billingError);
        // Kita tangkap error agar pendaftaran tetap berjalan sukses meskipun billing terkendala master data
      }

      return newKunjungan;
    });
  }

  // Fungsi lainnya tetap dibiarkan utuh aman
  async findAll() {
    return this.prisma.kunjungan.findMany({
      include: {
        pasien: true,
        cara_bayar: true,
        penjamin: true,
        asal_rujukan: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.kunjungan.findUnique({
      where: { id_kunjungan: id },
      include: {
        cara_bayar: true,
        penjamin: true,
        asal_rujukan: true,
        pasien: {
          include: {
            jenis_alamat: true,
            provinsi: true,
            kabupaten: true,
            kecamatan: true,
            kelurahan: true,
          },
        },
      },
    });
  }

  async findTracking() {
    return this.prisma.kunjungan.findMany({
      include: {
        cara_bayar: true,
        penjamin: true,
        asal_rujukan: true,
        pasien: {
          include: {
            jenis_alamat: true,
            provinsi: true,
            kabupaten: true,
            kecamatan: true,
            kelurahan: true,
          },
        },
        antrean: true,
        asesmen_keperawatan: true,
        pemeriksaan_dokter: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async update(id: string, updateKunjunganDto: any) {
    return this.prisma.kunjungan.update({
      where: { id_kunjungan: id },
      data: updateKunjunganDto,
    });
  }
}