import { Controller, Get, Param, Patch, Body, Post } from '@nestjs/common';
import { TareasAseoService } from './tareas-aseo.service';

@Controller('tareas-aseo')
export class TareasAseoController {
  constructor(private readonly tareasAseoService: TareasAseoService) { }

  @Post()
  create(@Body() createTareaDto: any) {
    return this.tareasAseoService.create(createTareaDto);
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

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTareaDto: any) {
    return this.tareasAseoService.update(id, updateTareaDto);
  }
}