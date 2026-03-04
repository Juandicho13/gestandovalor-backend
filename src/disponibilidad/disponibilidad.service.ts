import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DisponibilidadService {
  constructor(private prisma: PrismaService) {}

  async getActivos() {
    // Aquí usamos 'activo' porque ya lo aseguramos en el schema.prisma
    return this.prisma.disponibilidad.findMany({
      where: { activo: true }
    });
  }

  async updateHorarios(horarios: {dia: number, hora: string}[]) {
    await this.prisma.disponibilidad.deleteMany();

    if (!horarios || horarios.length === 0) return { message: 'Sin horarios' };

    const dataToInsert = horarios.map(h => ({
      diaSemana: h.dia,
      hora: h.hora,
      activo: true
      // No incluimos 'fecha' aquí porque lo quitamos del schema o lo hicimos opcional
    }));

    await this.prisma.disponibilidad.createMany({
      data: dataToInsert
    });

    return { message: 'Horarios actualizados exitosamente' };
  }
}