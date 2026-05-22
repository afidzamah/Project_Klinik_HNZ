import { PartialType } from '@nestjs/swagger';
import { CreateMasterDokterDto } from './create-master-dokter.dto';

export class UpdateMasterDokterDto extends PartialType(CreateMasterDokterDto) {}
