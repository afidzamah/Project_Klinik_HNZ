import { Controller, Get, Post, Body } from '@nestjs/common';
import { ResepService } from './resep.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateResepDto } from './dto/create-resep.dto';

@ApiTags('Farmasi / Apotek (E-Prescribing)')
@Controller('resep')
export class ResepController {
  constructor(private readonly resepService: ResepService) {}

  @Post()
  @ApiOperation({ summary: 'Dokter: Kirim Resep ke Apotek' })
  create(@Body() createResepDto: CreateResepDto) {
    return this.resepService.create(createResepDto);
  }

  @Get()
  @ApiOperation({ summary: 'Apoteker: Lihat Daftar Resep Masuk' })
  findAll() {
    return this.resepService.findAll();
  }
}