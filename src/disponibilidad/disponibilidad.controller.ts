import { Controller, Get, Post, Body } from '@nestjs/common';
import { DisponibilidadService } from './disponibilidad.service';
import { Publico, Roles } from '../auth/seguridad';

@Controller('disponibilidad')
export class DisponibilidadController {
  constructor(private readonly disponibilidadService: DisponibilidadService) { }

  @Publico()
  @Get()
  getActivos() {
    return this.disponibilidadService.getActivos();
  }

  // Cambiar los horarios de asesoría: solo el admin
  @Roles('ADMIN')
  @Post()
  updateHorarios(@Body() horarios: any[]) {
    return this.disponibilidadService.updateHorarios(horarios);
  }
}