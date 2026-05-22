import { Controller, Get, Post, Body } from '@nestjs/common';
import { AsesmenKeperawatanService } from './asesmen-keperawatan.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger'; 
import { CreateAsesmenKeperawatanDto } from './dto/create-asesmen-keperawatan.dto'; // Import DTO

@ApiTags('Nurse Station (Triage)')
@Controller('asesmen-keperawatan')
export class AsesmenKeperawatanController {
  constructor(private readonly asesmenKeperawatanService: AsesmenKeperawatanService) {}

  @Post()
  @ApiOperation({ summary: 'Input Data TTV & Keluhan Pasien' })
  // Kita ganti tipe 'any' menjadi nama DTO kita. Swagger akan otomatis membacanya!
  create(@Body() createAsesmenDto: CreateAsesmenKeperawatanDto) {
    return this.asesmenKeperawatanService.create(createAsesmenDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lihat Seluruh Data Asesmen Keperawatan' })
  findAll() {
    return this.asesmenKeperawatanService.findAll();
  }
}