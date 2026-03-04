import { Controller, Get, Post, Body } from '@nestjs/common';
import { DisponibilidadService } from './disponibilidad.service';

@Controller('disponibilidad')
export class DisponibilidadController {
  constructor(private readonly disponibilidadService: DisponibilidadService) {}

  @Get()
  getActivos() {
    return this.disponibilidadService.getActivos();
  }

  @Post()
  updateHorarios(@Body() horarios: any[]) {
    return this.disponibilidadService.updateHorarios(horarios);
  }
}