import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
  import { AntreanService } from './antrean.service';
  import { ApiTags } from '@nestjs/swagger';

  @ApiTags('Queue Management')
  @Controller('antrean')
  export class AntreanController {
    constructor(private readonly antreanService: AntreanService) {}

    @Post()
    create(@Body() createAntreanDto: any) {
      return this.antreanService.create(createAntreanDto);
    }

    @Get()
    findAll() {
      return this.antreanService.findAll();
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateAntreanDto: any) {
      return this.antreanService.update(id, updateAntreanDto);
    }
  }