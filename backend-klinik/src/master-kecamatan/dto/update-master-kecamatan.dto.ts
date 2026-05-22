import { PartialType } from '@nestjs/swagger';
import { CreateMasterKecamatanDto } from './create-master-kecamatan.dto';

export class UpdateMasterKecamatanDto extends PartialType(CreateMasterKecamatanDto) {}
