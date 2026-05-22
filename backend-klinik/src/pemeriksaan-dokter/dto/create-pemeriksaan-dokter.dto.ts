import { ApiProperty } from '@nestjs/swagger';

export class CreatePemeriksaanDokterDto {
  @ApiProperty({ example: 'PASTE_ID_KUNJUNGAN_DISINI', description: 'ID Kunjungan Pasien' })
  id_kunjungan: string;

  @ApiProperty({ example: 'ID_DOKTER_DISINI', description: 'ID Dokter Pemeriksa' })
  id_dokter: string;

  @ApiProperty({ example: 'Pasien mengeluh pusing berputar dan mual sejak pagi.', description: 'Anamnesis Subjektif (S)' })
  anamnesis_subjektif: string;

  // Ini adalah bagian ajaib dari JSONB. Kita mendefinisikannya sebagai objek bebas!
  @ApiProperty({ 
    example: {
      "mata": "konjungtiva tidak anemis",
      "tht": "tonsil T1-T1, hiperemis (-)",
      "neurologis": "refleks fisiologis normal"
    }, 
    description: 'Pemeriksaan Fisik Objektif (O) - Format JSON Fleksibel Sesuai Spesialis' 
  })
  pemeriksaan_fisik_objektif: Record<string, any>; 

  @ApiProperty({ example: 'Istirahat cukup, hindari makanan pedas.', description: 'Rencana Terapi / Plan (P)' })
  rencana_terapi_plan: string;
}