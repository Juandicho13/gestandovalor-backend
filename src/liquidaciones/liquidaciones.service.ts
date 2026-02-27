import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LiquidacionesService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.liquidacion.create({ data });
  }

  findAll() {
    return this.prisma.liquidacion.findMany({
      include: { propietario: { select: { nombre: true } } }
    });
  }

  // ¡AQUÍ ESTÁ LA CLAVE! Fíjate que dice (id: string) y no (id: number)
  findOne(id: string) {
    return this.prisma.liquidacion.findUnique({ where: { id } });
  }

  update(id: string, data: any) {
    return this.prisma.liquidacion.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.liquidacion.delete({ where: { id } });
  }
}