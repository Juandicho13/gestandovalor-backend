import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { Publico } from '../auth/seguridad';

@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) { }

  // 🐴 --- PUERTAS DE TROYA (TIENEN QUE IR HASTA ARRIBA PARA NO CHOCAR) --- 🐴
  @Get('troya/aseos')
  obtenerAseos() {
    return this.reservasService.obtenerAseos();
  }

  @Post('troya/aseos')
  crearAseo(@Body() data: any) {
    return this.reservasService.crearAseo(data);
  }

  // --- RUTAS PÚBLICAS DE DISPONIBILIDAD (sin datos de huéspedes) ---
  @Publico()
  @Get('ocupacion/:id')
  ocupacion(@Param('id') id: string) {
    return this.reservasService.ocupacionPublica(id);
  }

  @Publico()
  @Get('ocupadas')
  ocupadas(@Query('in') llegada: string, @Query('out') salida: string) {
    return this.reservasService.propiedadesOcupadas(llegada, salida);
  }

  // --- LO ORIGINAL DE RESERVAS (VA ABAJO) ---
  @Post()
  create(@Body() createReservaDto: any) {
    return this.reservasService.create(createReservaDto);
  }

  @Get()
  findAll() {
    return this.reservasService.findAll();
  }

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
  // ... (tus otras rutas de troya)
  @Patch('troya/aseos/:id')
  actualizarAseo(@Param('id') id: string, @Body() data: any) {
    return this.reservasService.actualizarAseo(id, data);
  }

  // ✨ NUEVO: PUERTA SECRETA PARA ELIMINAR ✨
  @Delete('troya/aseos/:id')
  eliminarAseo(@Param('id') id: string) {
    return this.reservasService.eliminarAseo(id);
  }

  // --- LO ORIGINAL DE RESERVAS (VA ABAJO) ---
}