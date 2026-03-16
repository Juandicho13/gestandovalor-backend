import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TareasAseoService {
  constructor(private prisma: PrismaService) { }

  async create(data: any) {
    return this.prisma.tareasAseo.create({ data });
  }

  async findByEmpleado(empleado_id: string) {
    return this.prisma.tareasAseo.findMany({
      where: { empleado_id },
      include: {
        propiedad: true // <-- Trae el título, dirección y clave de la cerradura
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async update(id: string, data: any) {
    return this.prisma.tareasAseo.update({
      where: { id },
      data,
    });
  }
}