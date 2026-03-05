import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PropiedadesService } from './propiedades.service';

@Controller('propiedades')
export class PropiedadesController {
  constructor(private readonly propiedadesService: PropiedadesService) {}

  @Post()
  create(@Body() body: any) {
    return this.propiedadesService.create(body);
  }

  @Get()
  findAll() {
    return this.propiedadesService.findAll();
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