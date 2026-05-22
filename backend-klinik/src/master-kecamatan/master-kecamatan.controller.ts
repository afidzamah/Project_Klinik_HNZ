import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MasterKecamatanService } from './master-kecamatan.service';
import { CreateMasterKecamatanDto } from './dto/create-master-kecamatan.dto';
import { UpdateMasterKecamatanDto } from './dto/update-master-kecamatan.dto';

@Controller('master-kecamatan')
export class MasterKecamatanController {
  constructor(private readonly masterKecamatanService: MasterKecamatanService) {}

  @Post()
  create(@Body() createMasterKecamatanDto: CreateMasterKecamatanDto) {
    return this.masterKecamatanService.create(createMasterKecamatanDto);
  }

  @Get()
  findAll() {
    return this.masterKecamatanService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.masterKecamatanService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMasterKecamatanDto: UpdateMasterKecamatanDto) {
    return this.masterKecamatanService.update(+id, updateMasterKecamatanDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.masterKecamatanService.remove(+id);
  }
}
