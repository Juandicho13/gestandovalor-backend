import { Module } from '@nestjs/common';
import { PropiedadesService } from './propiedades.service';
import { PropiedadesController } from './propiedades.controller';
import { PrismaService } from '../prisma/prisma.service'; // <-- Importamos Prisma

@Module({
  controllers: [PropiedadesController],
  providers: [PropiedadesService, PrismaService], // <-- Lo agregamos como proveedor
})
export class PropiedadesModule {}