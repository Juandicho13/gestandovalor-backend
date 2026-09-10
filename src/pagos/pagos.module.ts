import { Module } from '@nestjs/common';
import { PagosService } from './pagos.service';
import { PagosController } from './pagos.controller';
import { PrismaService } from '../prisma/prisma.service'; // <-- Importamos el Servicio directamente

@Module({
  controllers: [PagosController],
  providers: [PagosService, PrismaService], // <-- Lo agregamos aquí a los providers
})
export class PagosModule { }