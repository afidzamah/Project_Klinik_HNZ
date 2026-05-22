import { PartialType } from '@nestjs/swagger';
import { CreatePemeriksaanDokterDto } from './create-pemeriksaan-dokter.dto';

export class UpdatePemeriksaanDokterDto extends PartialType(CreatePemeriksaanDokterDto) {}
