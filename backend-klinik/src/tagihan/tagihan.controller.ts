import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { TagihanService } from './tagihan.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateTagihanDto } from './dto/create-tagihan.dto';

@ApiTags('Kasir / Billing')
@Controller('tagihan')
export class TagihanController {
  constructor(private readonly tagihanService: TagihanService) {}

  @Post()
  @ApiOperation({ summary: 'Kasir: Buat Invoice & Terima Pembayaran' })
  create(@Body() createTagihanDto: CreateTagihanDto) {
    return this.tagihanService.create(createTagihanDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lihat Seluruh Riwayat Transaksi' })
  findAll() {
    return this.tagihanService.findAll();
  }

  @Patch(':id/bayar')
  @ApiOperation({ summary: 'Kasir: Selesaikan & Melunasi Tagihan' })
  bayar(
    @Param('id') id: string,
    @Body() body: { metode_pembayaran: string; total_diskon?: number; total_netto?: number }
  ) {
    return this.tagihanService.bayar(id, body);
  }
}