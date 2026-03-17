import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // ✨ LA PRUEBA DEFINITIVA DE VIDA ✨
  @Get('ping')
  ping() {
    return { mensaje: '¡EL SERVIDOR SÍ SE ESTÁ ACTUALIZANDO!', status: 'OK' };
  }
}