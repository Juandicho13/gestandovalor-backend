import { Module } from '@nestjs/common';
import { TareasAseoService } from './tareas-aseo.service';
import { TareasAseoController } from './tareas-aseo.controller';
import { PrismaService } from '../prisma/prisma.service'; // <-- Invitamos a Prisma

@Module({
  controllers: [TareasAseoController],
  providers: [TareasAseoService, PrismaService], // <-- Le damos el pase VIP
})
export class TareasAseoModule {}