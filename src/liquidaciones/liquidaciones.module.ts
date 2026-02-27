import { Module } from '@nestjs/common';
import { LiquidacionesService } from './liquidaciones.service';
import { LiquidacionesController } from './liquidaciones.controller';
import { PrismaService } from '../prisma/prisma.service'; // <-- Importamos Prisma

@Module({
  controllers: [LiquidacionesController],
  providers: [LiquidacionesService, PrismaService], // <-- Lo agregamos como proveedor
})
export class LiquidacionesModule {}