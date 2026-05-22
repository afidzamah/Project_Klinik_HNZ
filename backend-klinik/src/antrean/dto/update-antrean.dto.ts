import { PartialType } from '@nestjs/mapped-types';
import { CreateAntreanDto } from './create-antrean.dto';

export class UpdateAntreanDto extends PartialType(CreateAntreanDto) {}
