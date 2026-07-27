import { Controller, Get, Post, Body, Patch, Param, Delete, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PropiedadesService } from './propiedades.service';

@Controller('propiedades')
export class PropiedadesController {
  constructor(private readonly propiedadesService: PropiedadesService) { }

  @Post()
  create(@Body() body: any) {
    return this.propiedadesService.create(body);
  }

  @Get()
  findAll() {
    return this.propiedadesService.findAll();
  }

  @Get('ciudades')
  obtenerCiudades() {
    return this.propiedadesService.obtenerCiudades();
  }

  @Get('resultados')
  obtenerResultadosBusqueda() {
    return this.propiedadesService.obtenerResultadosBusqueda();
  }
  @Get(':id/foto/:indice')
  async obtenerFoto(
    @Param('id') id: string,
    @Param('indice') indice: string,
    @Res() res: Response,
  ) {
    const { mime, buffer } = await this.propiedadesService.obtenerFoto(
      id,
      parseInt(indice, 10),
    );

    res.set({
      'Content-Type': mime,
      'Content-Length': buffer.length,
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
    res.end(buffer);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propiedadesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.propiedadesService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.propiedadesService.remove(id);
  }
}