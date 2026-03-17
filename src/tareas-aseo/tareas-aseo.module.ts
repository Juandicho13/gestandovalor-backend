import { Module } from '@nestjs/common';
import { TareasAseoService } from './tareas-aseo.service';
import { TareasAseoController } from './tareas-aseo.controller';
import { PrismaService } from '../prisma/prisma.service'; // <-- ESTE ES EL ENCHUFE 🔌

@Module({
  controllers: [TareasAseoController],
  providers: [TareasAseoService, PrismaService], // <-- LO CONECTAMOS AQUÍ
})
export class TareasAseoModule { }