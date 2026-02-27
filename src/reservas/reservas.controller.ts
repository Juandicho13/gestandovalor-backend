import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ReservasService } from './reservas.service';

@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Post()
  create(@Body() data: any) { return this.reservasService.create(data); }

  @Get()
  findAll() { return this.reservasService.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.reservasService.findOne(id); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) { return this.reservasService.update(id, data); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.reservasService.remove(id); }
}