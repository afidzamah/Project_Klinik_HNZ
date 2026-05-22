import { PartialType } from '@nestjs/swagger';
import { CreateResepDto } from './create-resep.dto';

export class UpdateResepDto extends PartialType(CreateResepDto) {}
