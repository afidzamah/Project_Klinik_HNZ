import { PartialType } from '@nestjs/swagger';
import { CreateMasterProvinsiDto } from './create-master-provinsi.dto';

export class UpdateMasterProvinsiDto extends PartialType(CreateMasterProvinsiDto) {}
