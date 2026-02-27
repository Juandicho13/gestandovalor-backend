import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { InventariosService } from './inventarios.service';

@Controller('inventarios')
export class InventariosController {
  constructor(private readonly inventariosService: InventariosService) {}

  @Post()
  create(@Body() data: any) { return this.inventariosService.create(data); }

  @Get()
  findAll() { return this.inventariosService.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.inventariosService.findOne(id); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) { return this.inventariosService.update(id, data); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.inventariosService.remove(id); }
}