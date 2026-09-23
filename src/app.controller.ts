import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Publico } from './auth/seguridad';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Publico()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // ✨ LA PRUEBA DEFINITIVA DE VIDA ✨
  @Publico()
  @Get('ping')
  ping() {
    return { mensaje: '¡EL SERVIDOR SÍ SE ESTÁ ACTUALIZANDO!', status: 'OK' };
  }
}