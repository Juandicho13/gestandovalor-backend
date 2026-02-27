import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReservasService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.reserva.create({ data });
  }

  findAll() {
    return this.prisma.reserva.findMany({
     include: { propiedad: { select: { titulo: true } } }
    });
  }

  findOne(id: string) {
    return this.prisma.reserva.findUnique({ where: { id } });
  }

  update(id: string, data: any) {
    return this.prisma.reserva.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.reserva.delete({ where: { id } });
  }
}