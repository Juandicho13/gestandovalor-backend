import { Module } from '@nestjs/common';
import { InventariosService } from './inventarios.service';
import { InventariosController } from './inventarios.controller';
import { PrismaService } from '../prisma/prisma.service'; // <-- Importamos Prisma

@Module({
  controllers: [InventariosController],
  providers: [InventariosService, PrismaService], // <-- Lo agregamos como proveedor
})
export class InventariosModule {}