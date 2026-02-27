import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LiquidacionesService } from './liquidaciones.service';

@Controller('liquidaciones')
export class LiquidacionesController {
  constructor(private readonly liquidacionesService: LiquidacionesService) {}

  @Post()
  create(@Body() data: any) { return this.liquidacionesService.create(data); }

  @Get()
  findAll() { return this.liquidacionesService.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.liquidacionesService.findOne(id); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) { return this.liquidacionesService.update(id, data); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.liquidacionesService.remove(id); }
}