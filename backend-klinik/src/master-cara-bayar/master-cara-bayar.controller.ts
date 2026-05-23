import { Controller, Get } from '@nestjs/common';
import { MasterCaraBayarService } from './master-cara-bayar.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Master Data')
@Controller('master-cara-bayar')
export class MasterCaraBayarController {
  constructor(private readonly caraBayarService: MasterCaraBayarService) {}

  @Get()
  @ApiOperation({ summary: 'Mendapatkan semua data master cara bayar beserta penjamin terkait' })
  findAll() {
    return this.caraBayarService.findAll();
  }
}
