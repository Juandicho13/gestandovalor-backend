import { Module } from '@nestjs/common';
import { ProspectosService } from './prospectos.service';
import { ProspectosController } from './prospectos.controller';
import { PrismaService } from '../prisma/prisma.service'; // <-- Importamos Prisma

@Module({
  controllers: [ProspectosController],
  providers: [ProspectosService, PrismaService], // <-- Lo agregamos aquí
})
export class ProspectosModule {}