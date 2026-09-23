import { Controller, Get, Post, Body, Patch, Param, Delete, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PropiedadesService } from './propiedades.service';
import { Publico } from '../auth/seguridad';

@Controller('propiedades')
export class PropiedadesController {
  constructor(private readonly propiedadesService: PropiedadesService) { }

  @Post()
  create(@Body() body: any) {
    return this.propiedadesService.create(body);
  }
  @Post('subir-foto')
  subirFoto(@Body() body: { imagen: string; propiedadId?: string }) {
    return this.propiedadesService.subirFoto(body.imagen, body.propiedadId);
  }
  @Post('url-subida')
  crearUrlSubida(@Body() body: { extension?: string; propiedadId?: string }) {
    return this.propiedadesService.crearUrlSubida(body.extension ?? 'webp', body.propiedadId);
  }

  @Get()
  findAll() {
    return this.propiedadesService.findAll();
  }

  @Publico()
  @Get('ciudades')
  obtenerCiudades() {
    return this.propiedadesService.obtenerCiudades();
  }

  @Publico()
  @Get('resultados')
  obtenerResultadosBusqueda() {
    return this.propiedadesService.obtenerResultadosBusqueda();
  }

  @Get('admin')
  obtenerListaAdmin() {
    return this.propiedadesService.obtenerListaAdmin();
  }

  @Publico()
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

  // Página pública de la suite: nunca enviamos claves de Wi-Fi, cerradura ni inventario
  @Publico()
  @Get(':id/detalle')
  async obtenerDetalleSuite(@Param('id') id: string) {
    const propiedad: Record<string, unknown> = {
      ...(await this.propiedadesService.obtenerDetalleSuite(id)),
    };
    for (const campo of ['wifi_red', 'wifi_pass', 'cerradura_codigo', 'inventario', 'propietario_id']) {
      delete propiedad[campo];
    }
    return propiedad;
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