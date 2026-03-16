import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TareasAseoService {
  constructor(private prisma: PrismaService) { }

  async create(data: any) {
    return this.prisma.tareasAseo.create({ data });
  }

  // ✨ ESTA ERA LA FUNCIÓN QUE FALTABA PARA EL AMA DE LLAVES ✨
  async findAll() {
    return this.prisma.tareasAseo.findMany({
      include: {
        propiedad: true,
        empleado: true
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async findByEmpleado(empleado_id: string) {
    return this.prisma.tareasAseo.findMany({
      where: { empleado_id },
      include: {
        propiedad: true
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