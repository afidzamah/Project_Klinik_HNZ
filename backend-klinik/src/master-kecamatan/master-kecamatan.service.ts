import { Injectable } from '@nestjs/common';
import { CreateMasterKecamatanDto } from './dto/create-master-kecamatan.dto';
import { UpdateMasterKecamatanDto } from './dto/update-master-kecamatan.dto';

@Injectable()
export class MasterKecamatanService {
  create(createMasterKecamatanDto: CreateMasterKecamatanDto) {
    return 'This action adds a new masterKecamatan';
  }

  findAll() {
    return `This action returns all masterKecamatan`;
  }

  findOne(id: number) {
    return `This action returns a #${id} masterKecamatan`;
  }

  update(id: number, updateMasterKecamatanDto: UpdateMasterKecamatanDto) {
    return `This action updates a #${id} masterKecamatan`;
  }

  remove(id: number) {
    return `This action removes a #${id} masterKecamatan`;
  }
}
