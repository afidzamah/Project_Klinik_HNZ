import { PartialType } from '@nestjs/mapped-types';
import { CreateKunjunganDto } from './create-kunjungan.dto';

export class UpdateKunjunganDto extends PartialType(CreateKunjunganDto) {}
