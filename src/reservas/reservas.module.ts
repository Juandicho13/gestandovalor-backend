import { Module } from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { ReservasController } from './reservas.controller';
import { PrismaService } from '../prisma/prisma.service'; // <-- Invitamos a Prisma

@Module({
  controllers: [ReservasController],
  providers: [ReservasService, PrismaService], // <-- Le damos el pase VIP aquí
})
export class ReservasModule {}