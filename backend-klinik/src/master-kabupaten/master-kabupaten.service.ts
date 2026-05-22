import { Injectable } from '@nestjs/common';
import { CreateMasterKabupatenDto } from './dto/create-master-kabupaten.dto';
import { UpdateMasterKabupatenDto } from './dto/update-master-kabupaten.dto';

@Injectable()
export class MasterKabupatenService {
  create(createMasterKabupatenDto: CreateMasterKabupatenDto) {
    return 'This action adds a new masterKabupaten';
  }

  findAll() {
    return `This action returns all masterKabupaten`;
  }

  findOne(id: number) {
    return `This action returns a #${id} masterKabupaten`;
  }

  update(id: number, updateMasterKabupatenDto: UpdateMasterKabupatenDto) {
    return `This action updates a #${id} masterKabupaten`;
  }

  remove(id: number) {
    return `This action removes a #${id} masterKabupaten`;
  }
}
