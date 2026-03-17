import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ReservasService } from './reservas.service';

@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) { }

  @Post()
  create(@Body() createReservaDto: any) {
    return this.reservasService.create(createReservaDto);
  }

  @Get()
  findAll() {
    return this.reservasService.findAll();
  }

  // ✨ AQUÍ ESTÁ CORREGIDO: findByPropiedad ✨
  @Get('propiedad/:id')
  findByPropiedad(@Param('id') id: string) {
    return this.reservasService.findByPropiedad(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReservaDto: any) {
    return this.reservasService.update(id, updateReservaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reservasService.remove(id);
  }
}