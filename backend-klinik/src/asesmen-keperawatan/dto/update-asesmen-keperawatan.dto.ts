import { PartialType } from '@nestjs/swagger';
import { CreateAsesmenKeperawatanDto } from './create-asesmen-keperawatan.dto';

export class UpdateAsesmenKeperawatanDto extends PartialType(CreateAsesmenKeperawatanDto) {}
