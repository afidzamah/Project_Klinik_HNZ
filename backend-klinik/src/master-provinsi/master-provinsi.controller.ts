import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MasterProvinsiService } from './master-provinsi.service';
import { CreateMasterProvinsiDto } from './dto/create-master-provinsi.dto';
import { UpdateMasterProvinsiDto } from './dto/update-master-provinsi.dto';

@Controller('master-provinsi')
export class MasterProvinsiController {
  constructor(private readonly masterProvinsiService: MasterProvinsiService) {}

  @Post()
  create(@Body() createMasterProvinsiDto: CreateMasterProvinsiDto) {
    return this.masterProvinsiService.create(createMasterProvinsiDto);
  }

  @Get()
  findAll() {
    return this.masterProvinsiService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.masterProvinsiService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMasterProvinsiDto: UpdateMasterProvinsiDto) {
    return this.masterProvinsiService.update(+id, updateMasterProvinsiDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.masterProvinsiService.remove(+id);
  }
}
