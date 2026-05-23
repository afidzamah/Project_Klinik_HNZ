import { Controller, Get } from '@nestjs/common';
import { MasterAsalRujukanService } from './master-asal-rujukan.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Master Data')
@Controller('master-asal-rujukan')
export class MasterAsalRujukanController {
  constructor(private readonly asalRujukanService: MasterAsalRujukanService) {}

  @Get()
  @ApiOperation({ summary: 'Mendapatkan semua data master asal rujukan' })
  findAll() {
    return this.asalRujukanService.findAll();
  }
}
