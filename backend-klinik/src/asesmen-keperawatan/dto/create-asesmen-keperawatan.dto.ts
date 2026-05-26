import { ApiProperty } from '@nestjs/swagger';

export class CreateAsesmenKeperawatanDto {
  @ApiProperty({ example: 'PASTE_ID_KUNJUNGAN_DISINI', description: 'ID Kunjungan Pasien' })
  id_kunjungan: string;

  @ApiProperty({ example: 'Sakit kepala hebat sejak 2 hari yang lalu', description: 'Keluhan utama pasien' })
  keluhan_utama: string;

  @ApiProperty({ example: 130, description: 'Tekanan darah sistole' })
  sistole: number;

  @ApiProperty({ example: 85, description: 'Tekanan darah diastole' })
  diastole: number;

  @ApiProperty({ example: 38.5, description: 'Suhu tubuh pasien' })
  suhu_tubuh: number;

  @ApiProperty({ example: 65, description: 'Berat badan pasien dalam KG' })
  berat_badan: number;

  @ApiProperty({ example: 170, description: 'Tinggi badan pasien dalam CM' })
  tinggi_badan: number;

  @ApiProperty({ example: 90, description: 'Detak jantung per menit' })
  detak_jantung: number;

  @ApiProperty({ example: 20, description: 'Tingkat pernapasan per menit' })
  respiratory_rate: number;

  @ApiProperty({ example: 'Udang', description: 'Alergi makanan', required: false })
  alergi_makanan?: string;

  @ApiProperty({ example: 'Penicillin', description: 'Alergi obat', required: false })
  alergi_obat?: string;
}