import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProspectosService } from './prospectos.service';
import { CreateProspectoDto } from './dto/create-prospecto.dto';
import { UpdateProspectoDto } from './dto/update-prospecto.dto';

@Controller('prospectos')
export class ProspectosController {
  constructor(private readonly prospectosService: ProspectosService) { }

  @Post()
  create(@Body() createProspectoDto: CreateProspectoDto) {
    return this.prospectosService.create(createProspectoDto);
  }

  @Get()
  findAll() {
    return this.prospectosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.prospectosService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProspectoDto: UpdateProspectoDto) {
    return this.prospectosService.update(id, updateProspectoDto);
  }

  // ✨ ESTO ES LO QUE NOS FALTABA ✨
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.prospectosService.remove(id);
  }
}