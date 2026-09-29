import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { TarifasService } from './tarifas.service';
import { Publico, Roles } from '../auth/seguridad';

@Controller('tarifas')
export class TarifasController {
    constructor(private readonly tarifasService: TarifasService) { }

    // Crear tarifas especiales: solo el admin
    @Roles('ADMIN')
    @Post()
    create(@Body() createTarifaDto: any) {
        return this.tarifasService.create(createTarifaDto);
    }

    @Publico()
    @Get('propiedad/:propiedadId')
    findByPropiedad(@Param('propiedadId') propiedadId: string) {
        return this.tarifasService.findByPropiedad(propiedadId);
    }
}