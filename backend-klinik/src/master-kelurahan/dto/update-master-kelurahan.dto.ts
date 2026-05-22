import { PartialType } from '@nestjs/swagger';
import { CreateMasterKelurahanDto } from './create-master-kelurahan.dto';

export class UpdateMasterKelurahanDto extends PartialType(CreateMasterKelurahanDto) {}
