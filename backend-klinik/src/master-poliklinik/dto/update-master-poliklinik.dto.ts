import { PartialType } from '@nestjs/swagger';
import { CreateMasterPoliklinikDto } from './create-master-poliklinik.dto';

export class UpdateMasterPoliklinikDto extends PartialType(CreateMasterPoliklinikDto) {}
