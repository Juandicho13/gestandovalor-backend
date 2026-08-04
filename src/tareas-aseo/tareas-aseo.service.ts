import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TareasAseoService {
  constructor(private prisma: PrismaService) { }

  async create(data: any) {
    try {
      // Guardado crudo, directo y sin relaciones complejas que fallen
      const nuevaTarea = await this.prisma.tareasAseo.create({
        data: {
          propiedad_id: String(data.propiedad_id),
          empleado_id: String(data.empleado_id),
          urgencia: String(data.urgencia || 'Normal'),
          estado: 'Pendiente',
          tiempo_segundos: 0
        }
      });
      return nuevaTarea;
    } catch (error) {
      console.error("🔥 Error forzado en base de datos:", error);
      // Si falla, ahora sí le avisará al frontend en lugar de decir "Todo bien"
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAll() {
    // Traemos la tabla cruda sin cruzar datos para que nunca se estrelle
    return await this.prisma.tareasAseo.findMany({
      orderBy: { created_at: 'desc' }
    });
  }

  async findByEmpleado(empleado_id: string) {
    return await this.prisma.tareasAseo.findMany({
      where: { empleado_id: String(empleado_id) }
    });
  }

  async update(id: string, data: any) {
    return this.prisma.tareasAseo.update({
      where: { id },
      data,
    });
  }
}