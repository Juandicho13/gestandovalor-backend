import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReservasService {
  constructor(private prisma: PrismaService) { }

  async create(data: any) {
    return this.prisma.reserva.create({ data });
  }

  // ✨ ESTA ES LA MAGIA QUE FALTA PARA EL AMA DE LLAVES ✨
  async findAll() {
    return this.prisma.reserva.findMany({
      orderBy: { check_out: 'asc' } // Ordenamos de la más próxima a la más lejana
    });
  }

  async findByPropiedad(propiedad_id: string) {
    return this.prisma.reserva.findMany({ where: { propiedad_id } });
  }

  async update(id: string, data: any) {
    return this.prisma.reserva.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.reserva.delete({ where: { id } });
  }
}