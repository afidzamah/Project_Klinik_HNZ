import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MasterKabupatenService } from './master-kabupaten.service';
import { CreateMasterKabupatenDto } from './dto/create-master-kabupaten.dto';
import { UpdateMasterKabupatenDto } from './dto/update-master-kabupaten.dto';

@Controller('master-kabupaten')
export class MasterKabupatenController {
  constructor(private readonly masterKabupatenService: MasterKabupatenService) {}

  @Post()
  create(@Body() createMasterKabupatenDto: CreateMasterKabupatenDto) {
    return this.masterKabupatenService.create(createMasterKabupatenDto);
  }

  @Get()
  findAll() {
    return this.masterKabupatenService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.masterKabupatenService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMasterKabupatenDto: UpdateMasterKabupatenDto) {
    return this.masterKabupatenService.update(+id, updateMasterKabupatenDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.masterKabupatenService.remove(+id);
  }
}
