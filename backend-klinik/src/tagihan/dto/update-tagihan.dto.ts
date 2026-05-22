import { PartialType } from '@nestjs/swagger';
import { CreateTagihanDto } from './create-tagihan.dto';

export class UpdateTagihanDto extends PartialType(CreateTagihanDto) {}
