import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TareasAseoService } from './tareas-aseo.service';

@Controller('tareas-aseo')
export class TareasAseoController {
  constructor(private readonly tareasAseoService: TareasAseoService) {}

  @Post()
  create(@Body() data: any) { return this.tareasAseoService.create(data); }

  @Get()
  findAll() { return this.tareasAseoService.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.tareasAseoService.findOne(id); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) { return this.tareasAseoService.update(id, data); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.tareasAseoService.remove(id); }
}