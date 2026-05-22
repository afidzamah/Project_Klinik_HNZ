import { PartialType } from '@nestjs/swagger';
import { CreateMasterKabupatenDto } from './create-master-kabupaten.dto';

export class UpdateMasterKabupatenDto extends PartialType(CreateMasterKabupatenDto) {}
