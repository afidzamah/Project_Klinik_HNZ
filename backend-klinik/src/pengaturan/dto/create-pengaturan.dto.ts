import { ApiProperty } from '@nestjs/swagger';

export class SavePengaturanDto {
  @ApiProperty({ example: 'default_cara_bayar', description: 'Kunci unik pengaturan aplikasi' })
  kunci: string;

  @ApiProperty({ example: 'UUID-CARA-BAYAR', description: 'Nilai dari pengaturan aplikasi' })
  nilai: string;

  @ApiProperty({ example: 'Default Cara Bayar untuk Loket Pendaftaran', description: 'Keterangan atau deskripsi fungsi pengaturan', required: false })
  keterangan?: string;
}
