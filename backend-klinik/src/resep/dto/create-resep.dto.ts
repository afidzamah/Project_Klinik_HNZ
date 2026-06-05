import { ApiProperty } from '@nestjs/swagger';

// 1. DTO untuk "Isi Amplop" (Detail Obat)
class ResepItemDto {
  @ApiProperty({ example: 'ID_OBAT_PARACETAMOL', description: 'ID Master Obat' })
  id_obat: string;

  @ApiProperty({ example: 'R/ Puyer Racikan', description: 'Nama obat jika kustom/racikan', required: false })
  nama_obat?: string;

  @ApiProperty({ example: 10, description: 'Jumlah obat yang diberikan' })
  jumlah: number;

  @ApiProperty({ example: '3x1 sesudah makan', description: 'Aturan pakai obat' })
  aturan_pakai: string;

  @ApiProperty({ example: 'Jika demam saja', description: 'Catatan tambahan apoteker', required: false })
  catatan_tambahan?: string;
}

// 2. DTO Utama untuk "Amplopnya" (Header Resep)
export class CreateResepDto {
  @ApiProperty({ example: 'PASTE_ID_KUNJUNGAN_DISINI', description: 'ID Kunjungan Pasien' })
  id_kunjungan: string;

  @ApiProperty({ 
    type: [ResepItemDto], 
    description: 'Daftar obat yang diresepkan oleh dokter' 
  })
  items: ResepItemDto[]; 
}