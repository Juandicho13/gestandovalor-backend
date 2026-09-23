import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { TarifasService } from './tarifas.service';
import { Publico } from '../auth/seguridad';

@Controller('tarifas')
export class TarifasController { // 👈 ¡Aquí está el otro export que faltaba!
    constructor(private readonly tarifasService: TarifasService) { }

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