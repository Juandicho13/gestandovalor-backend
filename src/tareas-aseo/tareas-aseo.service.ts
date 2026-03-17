import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TareasAseoService {
  constructor(private prisma: PrismaService) { }

  async create(data: any) {
    return this.prisma.tareasAseo.create({ data });
  }

  async findAll() {
    return this.prisma.tareasAseo.findMany({
      include: {
        propiedad: true,
        empleado: true
      }
      // ✨ ELIMINAMOS EL "orderBy: created_at" PARA EVITAR EL CRASH SILENCIOSO ✨
    });
  }

  async findByEmpleado(empleado_id: string) {
    return this.prisma.tareasAseo.findMany({
      where: { empleado_id },
      include: { propiedad: true }
    });
  }

  async update(id: string, data: any) {
    return this.prisma.tareasAseo.update({
      where: { id },
      data,
    });
  }
}