import { Module } from '@nestjs/common';
import { DisponibilidadService } from './disponibilidad.service';
import { DisponibilidadController } from './disponibilidad.controller';
import { PrismaService } from '../prisma/prisma.service'; // <-- Importamos Prisma

@Module({
  controllers: [DisponibilidadController],
  providers: [DisponibilidadService, PrismaService], // <-- Lo agregamos a los providers
})
export class DisponibilidadModule {}