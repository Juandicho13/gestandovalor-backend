import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProspectosService } from './prospectos.service';
import { CreateProspectoDto } from './dto/create-prospecto.dto';
import { UpdateProspectoDto } from './dto/update-prospecto.dto';
import { Publico, Roles } from '../auth/seguridad';

@Controller('prospectos')
export class ProspectosController {
  constructor(private readonly prospectosService: ProspectosService) { }

  // El formulario de contacto de la página es público
  @Publico()
  @Post()
  create(@Body() createProspectoDto: CreateProspectoDto) {
    return this.prospectosService.create(createProspectoDto);
  }

  // Ver, editar y borrar solicitudes: solo el admin
  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.prospectosService.findAll();
  }

  @Roles('ADMIN')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.prospectosService.findOne(id);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProspectoDto: UpdateProspectoDto) {
    return this.prospectosService.update(id, updateProspectoDto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.prospectosService.remove(id);
  }
}