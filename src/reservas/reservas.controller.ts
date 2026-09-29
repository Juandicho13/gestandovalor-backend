import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req } from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { Publico, Roles } from '../auth/seguridad';

@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) { }

  // 🐴 --- PUERTAS DE TROYA (TIENEN QUE IR HASTA ARRIBA PARA NO CHOCAR) --- 🐴
  // Los aseos los manejan el admin y la ama de llaves
  @Roles('ADMIN', 'AMA_LLAVES')
  @Get('troya/aseos')
  obtenerAseos() {
    return this.reservasService.obtenerAseos();
  }

  @Roles('ADMIN', 'AMA_LLAVES')
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
  @Roles('ADMIN')
  @Post()
  create(@Body() createReservaDto: any) {
    return this.reservasService.create(createReservaDto);
  }

  // El propietario solo recibe las reservas de sus apartamentos
  @Roles('ADMIN', 'AMA_LLAVES', 'PROPIETARIO')
  @Get()
  findAll(@Req() req: any) {
    const usuario = req.usuario;
    const soloMias = usuario?.rol === 'PROPIETARIO' ? usuario.sub : undefined;
    return this.reservasService.findAll(soloMias);
  }

  @Roles('ADMIN')
  @Get('propiedad/:id')
  findByPropiedad(@Param('id') id: string) {
    return this.reservasService.findByPropiedad(id);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReservaDto: any) {
    return this.reservasService.update(id, updateReservaDto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reservasService.remove(id);
  }

  @Roles('ADMIN', 'AMA_LLAVES')
  @Patch('troya/aseos/:id')
  actualizarAseo(@Param('id') id: string, @Body() data: any) {
    return this.reservasService.actualizarAseo(id, data);
  }

  // ✨ NUEVO: PUERTA SECRETA PARA ELIMINAR ✨
  @Roles('ADMIN', 'AMA_LLAVES')
  @Delete('troya/aseos/:id')
  eliminarAseo(@Param('id') id: string) {
    return this.reservasService.eliminarAseo(id);
  }
}