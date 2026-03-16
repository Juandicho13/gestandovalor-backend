import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservaDto } from './dto/create-reserva.dto';

@Injectable()
export class ReservasService {
  constructor(private prisma: PrismaService) { }

  async create(createReservaDto: CreateReservaDto) {
    try {
      // 1. Verificar si hay cruce de fechas (Evitar Overbooking)
      const cruce = await this.prisma.reserva.findFirst({
        where: {
          propiedad_id: createReservaDto.propiedad_id,
          estado_reserva: 'Confirmada',
          check_in: { lt: new Date(createReservaDto.check_out) },
          check_out: { gt: new Date(createReservaDto.check_in) },
        },
      });

      if (cruce) {
        throw new BadRequestException('Las fechas seleccionadas ya están ocupadas en este apartamento.');
      }

      // 2. Si todo está libre, guardamos la reserva
      return await this.prisma.reserva.create({
        data: {
          propiedad_id: createReservaDto.propiedad_id,
          huesped_nombre: createReservaDto.huesped_nombre,
          check_in: new Date(createReservaDto.check_in),
          check_out: new Date(createReservaDto.check_out),
          canal: createReservaDto.canal,
          monto_total: createReservaDto.monto_total,
          cantidad_huespedes: createReservaDto.cantidad_huespedes,
        },
      });
    } catch (error) {
      // 🔥 EL CHIVATO: Esto atrapará el error real y lo enviará al frontend 🔥
      console.error("🔥 ERROR REAL EN BD:", error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Fallo en BD: ${error.message}`);
    }
  }

  findAllByPropiedad(propiedadId: string) {
    return this.prisma.reserva.findMany({
      where: { propiedad_id: propiedadId },
      orderBy: { check_in: 'asc' }
    });
  }

  remove(id: string) {
    return this.prisma.reserva.delete({
      where: { id }
    });
  }
}