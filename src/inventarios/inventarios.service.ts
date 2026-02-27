import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventariosService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.inventario.create({ data });
  }

  findAll() {
    return this.prisma.inventario.findMany({
      include: { propiedad: { select: { nombre: true } } }
    });
  }

  findOne(id: string) {
    return this.prisma.inventario.findUnique({ where: { propiedad_id: id } });
  }

  update(id: string, data: any) {
    return this.prisma.inventario.update({ where: { propiedad_id: id }, data });
  }

  remove(id: string) {
    return this.prisma.inventario.delete({ where: { propiedad_id: id } });
  }
}