import { ApiProperty } from '@nestjs/swagger';

// 1. DTO untuk "Rincian Tagihan" (Detail Biaya)
class TagihanDetailDto {
  @ApiProperty({ example: 'Konsultasi Dokter Spesialis Dalam', description: 'Nama layanan atau obat' })
  item_layanan: string;

  @ApiProperty({ example: 'Jasa_Medis', description: 'Kategori biaya (Admin, Jasa_Medis, Obat, Tindakan)' })
  kategori_biaya: string;

  @ApiProperty({ example: 150000, description: 'Harga satuan' })
  harga_satuan: number;

  @ApiProperty({ example: 1, description: 'Jumlah kuantitas' })
  kuantitas: number;

  @ApiProperty({ example: 150000, description: 'Total harga untuk item ini' })
  subtotal: number;
}

// 2. DTO Utama untuk "Total Invoice" (Header Tagihan)
export class CreateTagihanDto {
  @ApiProperty({ example: 'PASTE_ID_KUNJUNGAN_DISINI', description: 'ID Kunjungan Pasien' })
  id_kunjungan: string;

  @ApiProperty({ example: 200000, description: 'Total biaya sebelum diskon' })
  total_bruto: number;

  @ApiProperty({ example: 0, description: 'Total diskon (jika ada)' })
  total_diskon: number;

  @ApiProperty({ example: 200000, description: 'Total akhir yang harus dibayar' })
  total_netto: number;

  @ApiProperty({ example: 'Tunai', description: 'Metode pembayaran (Tunai, QRIS, Transfer)' })
  metode_pembayaran: string;

  @ApiProperty({ 
    type: [TagihanDetailDto], 
    description: 'Daftar rincian biaya yang ditagihkan' 
  })
  items: TagihanDetailDto[]; 
}