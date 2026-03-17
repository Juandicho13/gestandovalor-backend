import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TareasAseoService {
  constructor(private prisma: PrismaService) { }

  async create(data: any) {
    return this.prisma.tareasAseo.create({ data });
  }

  async findAll() {
    try {
      // Intento 1: Traer la tarea con los nombres
      return await this.prisma.tareasAseo.findMany({
        include: {
          propiedad: true,
          empleado: true
        }
      });
    } catch (error) {
      console.log("🔥 Prisma se tropezó con las relaciones, activando modo supervivencia...");
      // Intento 2: Traer la tarea pura sin forzar relaciones
      return await this.prisma.tareasAseo.findMany();
    }
  }

  async findByEmpleado(empleado_id: string) {
    try {
      return await this.prisma.tareasAseo.findMany({
        where: { empleado_id },
        include: { propiedad: true }
      });
    } catch (e) {
      return await this.prisma.tareasAseo.findMany({ where: { empleado_id } });
    }
  }

  async update(id: string, data: any) {
    return this.prisma.tareasAseo.update({
      where: { id },
      data,
    });
  }
}