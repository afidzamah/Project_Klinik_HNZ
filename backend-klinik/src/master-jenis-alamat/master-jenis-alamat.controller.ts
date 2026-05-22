import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MasterJenisAlamatService } from './master-jenis-alamat.service';
import { CreateMasterJenisAlamatDto } from './dto/create-master-jenis-alamat.dto';
import { UpdateMasterJenisAlamatDto } from './dto/update-master-jenis-alamat.dto';

@Controller('master-jenis-alamat')
export class MasterJenisAlamatController {
  constructor(private readonly masterJenisAlamatService: MasterJenisAlamatService) {}

  @Post()
  create(@Body() createMasterJenisAlamatDto: CreateMasterJenisAlamatDto) {
    return this.masterJenisAlamatService.create(createMasterJenisAlamatDto);
  }

  @Get()
  findAll() {
    return this.masterJenisAlamatService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.masterJenisAlamatService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMasterJenisAlamatDto: UpdateMasterJenisAlamatDto) {
    return this.masterJenisAlamatService.update(+id, updateMasterJenisAlamatDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.masterJenisAlamatService.remove(+id);
  }
}
