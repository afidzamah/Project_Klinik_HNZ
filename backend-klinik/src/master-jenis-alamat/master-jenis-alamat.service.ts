import { Injectable } from '@nestjs/common';
import { CreateMasterJenisAlamatDto } from './dto/create-master-jenis-alamat.dto';
import { UpdateMasterJenisAlamatDto } from './dto/update-master-jenis-alamat.dto';

@Injectable()
export class MasterJenisAlamatService {
  create(createMasterJenisAlamatDto: CreateMasterJenisAlamatDto) {
    return 'This action adds a new masterJenisAlamat';
  }

  findAll() {
    return `This action returns all masterJenisAlamat`;
  }

  findOne(id: number) {
    return `This action returns a #${id} masterJenisAlamat`;
  }

  update(id: number, updateMasterJenisAlamatDto: UpdateMasterJenisAlamatDto) {
    return `This action updates a #${id} masterJenisAlamat`;
  }

  remove(id: number) {
    return `This action removes a #${id} masterJenisAlamat`;
  }
}
