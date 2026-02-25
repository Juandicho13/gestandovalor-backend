import { Controller, Get, Post, Body } from '@nestjs/common';
import { ProspectosService } from './prospectos.service';
import { CreateProspectoDto } from './dto/create-prospecto.dto';

@Controller('prospectos')
export class ProspectosController {
  constructor(private readonly prospectosService: ProspectosService) {}

  // Este es el punto de entrada para el Formulario Web
  @Post()
  create(@Body() createProspectoDto: CreateProspectoDto) {
    return this.prospectosService.create(createProspectoDto);
  }

  // Este te servirá a ti para ver la lista de interesados
  @Get()
  findAll() {
    return this.prospectosService.findAll();
  }
}