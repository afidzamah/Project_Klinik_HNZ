import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MasterKelurahanService } from './master-kelurahan.service';
import { CreateMasterKelurahanDto } from './dto/create-master-kelurahan.dto';
import { UpdateMasterKelurahanDto } from './dto/update-master-kelurahan.dto';

@Controller('master-kelurahan')
export class MasterKelurahanController {
  constructor(private readonly masterKelurahanService: MasterKelurahanService) {}

  @Post()
  create(@Body() createMasterKelurahanDto: CreateMasterKelurahanDto) {
    return this.masterKelurahanService.create(createMasterKelurahanDto);
  }

  @Get()
  findAll() {
    return this.masterKelurahanService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.masterKelurahanService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMasterKelurahanDto: UpdateMasterKelurahanDto) {
    return this.masterKelurahanService.update(+id, updateMasterKelurahanDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.masterKelurahanService.remove(+id);
  }
}
