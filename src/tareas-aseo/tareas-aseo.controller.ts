import { Controller, Get, Param, Patch, Body, Post, Delete, Req, ForbiddenException } from '@nestjs/common';
import { TareasAseoService } from './tareas-aseo.service';
import { Roles } from '../auth/seguridad';

@Controller('tareas-aseo')
export class TareasAseoController {
  constructor(private readonly tareasAseoService: TareasAseoService) { }

  @Roles('ADMIN', 'AMA_LLAVES')
  @Post()
  create(@Body() createTareaDto: any) {
    return this.tareasAseoService.create(createTareaDto);
  }

  // ✨ ESTA ES LA PUERTA QUE FALTABA ABRIR ✨
  @Roles('ADMIN', 'AMA_LLAVES')
  @Get()
  findAll() {
    return this.tareasAseoService.findAll();
  }

  // Cada persona de aseo solo ve sus propios aseos
  @Roles('ADMIN', 'AMA_LLAVES', 'ASEO')
  @Get('empleado/:id')
  findByEmpleado(@Param('id') id: string, @Req() req: any) {
    if (req.usuario?.rol === 'ASEO' && req.usuario.sub !== id) {
      throw new ForbiddenException('Solo puedes ver tus propios aseos');
    }
    return this.tareasAseoService.findByEmpleado(id);
  }

  // Aseo solo actualiza los suyos; el admin y la ama de llaves, cualquiera
  @Roles('ADMIN', 'AMA_LLAVES', 'ASEO')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateTareaDto: any, @Req() req: any) {
    if (req.usuario?.rol === 'ASEO') {
      await this.tareasAseoService.revisarCambioDelEmpleado(id, updateTareaDto, req.usuario.sub);
    }
    return this.tareasAseoService.update(id, updateTareaDto);
  }

  // ✨ Elimina el reporte de novedad (texto y fotos) de una tarea
  @Roles('ADMIN', 'AMA_LLAVES')
  @Delete(':id/novedad')
  eliminarNovedad(@Param('id') id: string) {
    return this.tareasAseoService.eliminarNovedad(id);
  }
}