import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TareasAseoService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.tareasAseo.create({ data });
  }

  findAll() {
    return this.prisma.tareasAseo.findMany({
      include: {
          propiedad: { select: { titulo: true } }, // <-- Cambiamos nombre por titulo
          empleado: { select: { nombre: true } } // (El empleado sí sigue teniendo nombre, ese déjalo igual)
      }
    });
  }

  findOne(id: string) {
    return this.prisma.tareasAseo.findUnique({ where: { id } });
  }

  update(id: string, data: any) {
    return this.prisma.tareasAseo.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.tareasAseo.delete({ where: { id } });
  }
}