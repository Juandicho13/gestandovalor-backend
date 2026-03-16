import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { CreateReservaDto } from './dto/create-reserva.dto';

@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) { }

  @Post()
  create(@Body() createReservaDto: CreateReservaDto) {
    return this.reservasService.create(createReservaDto);
  }

  @Get('propiedad/:propiedadId')
  findAllByPropiedad(@Param('propiedadId') propiedadId: string) {
    return this.reservasService.findAllByPropiedad(propiedadId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reservasService.remove(id);
  }
}