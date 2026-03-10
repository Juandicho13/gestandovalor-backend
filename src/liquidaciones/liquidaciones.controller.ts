import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { LiquidacionesService } from './liquidaciones.service';

@Controller('liquidaciones')
export class LiquidacionesController {
  constructor(private readonly liquidacionesService: LiquidacionesService) {}

  // 1. Recibir y guardar el PDF
  @Post()
  create(@Body() body: any) {
    return this.liquidacionesService.subirLiquidacion(body);
  }

  // 2. ESTA ES LA RUTA MÁGICA QUE LE FALTABA AL FRONTEND
  @Get('propiedad/:id')
  obtenerPorPropiedad(@Param('id') id: string) {
    return this.liquidacionesService.obtenerPorPropiedad(id);
  }

  // 3. Ver todas (por si luego haces un panel de admin general)
  @Get()
  findAll() {
    return this.liquidacionesService.findAll();
  }

  // 👇 4. ESTO ES LO ÚNICO NUEVO: LA RUTA PARA BORRAR EL PDF 👇
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.liquidacionesService.remove(id);
  }
}