import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { AsesmenKeperawatanService } from './asesmen-keperawatan.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger'; 
import { CreateAsesmenKeperawatanDto } from './dto/create-asesmen-keperawatan.dto';

@ApiTags('Nurse Station (Triage)')
@Controller('asesmen-keperawatan')
export class AsesmenKeperawatanController {
  constructor(private readonly asesmenKeperawatanService: AsesmenKeperawatanService) {}

  @Post()
  @ApiOperation({ summary: 'Input Data TTV & Keluhan Pasien' })
  create(@Body() createAsesmenDto: CreateAsesmenKeperawatanDto) {
    return this.asesmenKeperawatanService.create(createAsesmenDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lihat Seluruh Data Asesmen Keperawatan' })
  findAll() {
    return this.asesmenKeperawatanService.findAll();
  }

  @Post('parse-lab-pdf')
  @ApiOperation({ summary: 'AI OCR Multimodal Parser Hasil Lab PDF/Image via Gemini' })
  async parseLabPdf(@Body() body: { base64Data: string; mimeType: string }) {
    return this.asesmenKeperawatanService.parseLabPdf(body.base64Data, body.mimeType);
  }

  @Post('hasil-lab')
  @ApiOperation({ summary: 'Simpan Data Hasil Lab Terverifikasi ke Database' })
  async saveHasilLab(@Body() body: any) {
    return this.asesmenKeperawatanService.saveHasilLab(body);
  }

  @Get('hasil-lab/:id_kunjungan')
  @ApiOperation({ summary: 'Ambil Hasil Lab Pasien untuk Kunjungan Tertentu' })
  async getHasilLabByKunjungan(@Param('id_kunjungan') idKunjungan: string) {
    return this.asesmenKeperawatanService.getHasilLabByKunjungan(idKunjungan);
  }

  @Delete('hasil-lab/:id')
  @ApiOperation({ summary: 'Hapus Satu Berkas Hasil Lab' })
  async deleteHasilLab(@Param('id') id: string) {
    return this.asesmenKeperawatanService.deleteHasilLab(id);
  }

  @Post('hasil-lab/analisis')
  @ApiOperation({ summary: 'Jalankan AI Analisis Klinis & Rekomendasi Medis' })
  async analyzeLabResults(@Body() body: { daftar_pemeriksaan: any[] }) {
    return this.asesmenKeperawatanService.analyzeLabResults(body.daftar_pemeriksaan);
  }
}