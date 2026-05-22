import { PartialType } from '@nestjs/swagger';
import { CreateMasterJenisAlamatDto } from './create-master-jenis-alamat.dto';

export class UpdateMasterJenisAlamatDto extends PartialType(CreateMasterJenisAlamatDto) {}
