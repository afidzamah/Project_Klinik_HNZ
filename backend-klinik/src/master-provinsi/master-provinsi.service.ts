import { Injectable } from '@nestjs/common';
import { CreateMasterProvinsiDto } from './dto/create-master-provinsi.dto';
import { UpdateMasterProvinsiDto } from './dto/update-master-provinsi.dto';

@Injectable()
export class MasterProvinsiService {
  create(createMasterProvinsiDto: CreateMasterProvinsiDto) {
    return 'This action adds a new masterProvinsi';
  }

  findAll() {
    return `This action returns all masterProvinsi`;
  }

  findOne(id: number) {
    return `This action returns a #${id} masterProvinsi`;
  }

  update(id: number, updateMasterProvinsiDto: UpdateMasterProvinsiDto) {
    return `This action updates a #${id} masterProvinsi`;
  }

  remove(id: number) {
    return `This action removes a #${id} masterProvinsi`;
  }
}
