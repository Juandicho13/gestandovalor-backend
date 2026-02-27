import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TareasAseoService } from './tareas-aseo.service';
import { CreateTareasAseoDto } from './dto/create-tareas-aseo.dto';
import { UpdateTareasAseoDto } from './dto/update-tareas-aseo.dto';

@Controller('tareas-aseo')
export class TareasAseoController {
  constructor(private readonly tareasAseoService: TareasAseoService) {}

  @Post()
  create(@Body() createTareasAseoDto: CreateTareasAseoDto) {
    return this.tareasAseoService.create(createTareasAseoDto);
  }

  @Get()
  findAll() {
    return this.tareasAseoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tareasAseoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTareasAseoDto: UpdateTareasAseoDto) {
    return this.tareasAseoService.update(+id, updateTareasAseoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tareasAseoService.remove(+id);
  }
}
