import { ApiProperty } from '@nestjs/swagger';

export class CreateJadwalDokterDto {
  @ApiProperty({ example: 'Senin', description: 'Hari praktek dokter' })
  hari: string;

  @ApiProperty({ example: 'UUID-POLIKLINIK', description: 'ID Poliklinik' })
  id_poli: string;

  @ApiProperty({ example: 'UUID-DOKTER', description: 'ID Dokter' })
  id_dokter: string;

  @ApiProperty({ example: '08:00', description: 'Jam mulai praktek (HH:mm)' })
  jam_mulai: string;

  @ApiProperty({ example: '12:00', description: 'Jam selesai praktek (HH:mm)' })
  jam_selesai: string;

  @ApiProperty({ example: 30, description: 'Kuota antrean pasien' })
  kuota: number;
}
