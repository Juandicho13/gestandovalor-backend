import { Controller, Get, Param, Patch, Body, Post, Delete } from '@nestjs/common';
import { TareasAseoService } from './tareas-aseo.service';

@Controller('tareas-aseo')
export class TareasAseoController {
  constructor(private readonly tareasAseoService: TareasAseoService) { }

  @Post()
  create(@Body() createTareaDto: any) {
    return this.tareasAseoService.create(createTareaDto);
  }

  // Permiso para subir una foto de novedad directo a Storage
  @Post('url-subida')
  crearUrlSubida(@Body() body: { extension?: string; tareaId?: string }) {
    return this.tareasAseoService.crearUrlSubida(body.extension ?? 'webp', body.tareaId);
  }

  // ✨ ESTA ES LA PUERTA QUE FALTABA ABRIR ✨
  @Get()
  findAll() {
    return this.tareasAseoService.findAll();
  }

  @Get('empleado/:id')
  findByEmpleado(@Param('id') id: string) {
    return this.tareasAseoService.findByEmpleado(id);
  }

  // El limpiador reporta un daño o faltante (texto y/o fotos)
  @Post(':id/novedad')
  reportarNovedad(
    @Param('id') id: string,
    @Body() body: { descripcion?: string; fotos?: string[] },
  ) {
    return this.tareasAseoService.reportarNovedad(id, body);
  }

  // El admin la marca como resuelta o la reabre
  @Patch(':id/novedad')
  cambiarEstadoNovedad(@Param('id') id: string, @Body() body: { estado?: string }) {
    return this.tareasAseoService.cambiarEstadoNovedad(id, body?.estado ?? 'Pendiente');
  }

  // El admin borra el reporte (texto y fotos) sin tocar la tarea de aseo
  @Delete(':id/novedad')
  eliminarNovedad(@Param('id') id: string) {
    return this.tareasAseoService.eliminarNovedad(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTareaDto: any) {
    return this.tareasAseoService.update(id, updateTareaDto);
  }
}
