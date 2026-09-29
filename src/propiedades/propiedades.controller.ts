import { Controller, Get, Post, Body, Patch, Param, Delete, Res, Req } from '@nestjs/common';
import type { Response } from 'express';
import { PropiedadesService } from './propiedades.service';
import { Publico, Roles } from '../auth/seguridad';


@Controller('propiedades')
export class PropiedadesController {
  constructor(private readonly propiedadesService: PropiedadesService) { }

  @Roles('ADMIN')
  @Post()
  create(@Body() body: any) {
    return this.propiedadesService.create(body);
  }

  // Subir fotos: el admin (editor), la ama de llaves y el equipo de aseo (fotos de novedades)
  @Roles('ADMIN', 'AMA_LLAVES', 'ASEO')
  @Post('subir-foto')
  subirFoto(@Body() body: { imagen: string; propiedadId?: string }) {
    return this.propiedadesService.subirFoto(body.imagen, body.propiedadId);
  }

  @Roles('ADMIN', 'AMA_LLAVES', 'ASEO')
  @Post('url-subida')
  crearUrlSubida(@Body() body: { extension?: string; propiedadId?: string }) {
    return this.propiedadesService.crearUrlSubida(body.extension ?? 'webp', body.propiedadId);
  }

  @Get()
  findAll(@Req() req: any) {
    // El token dice quién es. Un PROPIETARIO solo recibe sus apartamentos.
    const usuario = req.usuario;
    const soloMias = usuario?.rol === 'PROPIETARIO' ? usuario.sub : undefined;
    return this.propiedadesService.findAll(soloMias);
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

  @Roles('ADMIN')
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

  // Página pública de la suite: nunca enviamos claves de Wi-Fi, cerradura, número del apto ni inventario
  @Publico()
  @Get(':id/detalle')
  async obtenerDetalleSuite(@Param('id') id: string) {
    const propiedad: Record<string, unknown> = {
      ...(await this.propiedadesService.obtenerDetalleSuite(id)),
    };
    for (const campo of ['wifi_red', 'wifi_pass', 'cerradura_codigo', 'numero_alojamiento', 'inventario', 'propietario_id']) {
      delete propiedad[campo];
    }
    return propiedad;
  }

  @Roles('ADMIN')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propiedadesService.findOne(id);
  }

  // El admin cambia todo. La ama de llaves solo el inventario y el personal fijo.
  // El equipo de aseo solo el inventario del apartamento que está limpiando.
  @Roles('ADMIN', 'AMA_LLAVES', 'ASEO')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    await this.propiedadesService.revisarPermisoDeCambio(id, body, req.usuario);
    return this.propiedadesService.update(id, body);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.propiedadesService.remove(id);
  }
}