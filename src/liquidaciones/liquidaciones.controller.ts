import { Controller, Get, Post, Body, Param, Delete, Req } from '@nestjs/common';
import { LiquidacionesService } from './liquidaciones.service';
import { Roles } from '../auth/seguridad';

@Controller('liquidaciones')
export class LiquidacionesController {
  constructor(private readonly liquidacionesService: LiquidacionesService) { }

  // 1. Recibir y guardar el PDF
  @Roles('ADMIN')
  @Post()
  create(@Body() body: any) {
    return this.liquidacionesService.subirLiquidacion(body);
  }

  // 2. Reportes de un apartamento: el admin ve todos; el propietario solo los de sus apartamentos
  @Roles('ADMIN', 'PROPIETARIO')
  @Get('propiedad/:id')
  async obtenerPorPropiedad(@Param('id') id: string, @Req() req: any) {
    if (req.usuario?.rol === 'PROPIETARIO') {
      await this.liquidacionesService.revisarQueSeaSuya(id, req.usuario.sub);
    }
    return this.liquidacionesService.obtenerPorPropiedad(id);
  }

  // 3. Ver todas (por si luego haces un panel de admin general)
  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.liquidacionesService.findAll();
  }

  // 4. Borrar el PDF
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.liquidacionesService.remove(id);
  }
}