import { Injectable } from '@nestjs/common';
import { CreateMasterKelurahanDto } from './dto/create-master-kelurahan.dto';
import { UpdateMasterKelurahanDto } from './dto/update-master-kelurahan.dto';

@Injectable()
export class MasterKelurahanService {
  create(createMasterKelurahanDto: CreateMasterKelurahanDto) {
    return 'This action adds a new masterKelurahan';
  }

  findAll() {
    return `This action returns all masterKelurahan`;
  }

  findOne(id: number) {
    return `This action returns a #${id} masterKelurahan`;
  }

  update(id: number, updateMasterKelurahanDto: UpdateMasterKelurahanDto) {
    return `This action updates a #${id} masterKelurahan`;
  }

  remove(id: number) {
    return `This action removes a #${id} masterKelurahan`;
  }
}
