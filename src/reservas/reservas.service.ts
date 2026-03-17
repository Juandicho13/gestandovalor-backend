import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReservasService {
  constructor(private prisma: PrismaService) { }

  // --- LO ORIGINAL DE RESERVAS ---
  async create(data: any) {
    return this.prisma.reserva.create({ data });
  }

  async findAll() {
    return this.prisma.reserva.findMany({
      orderBy: { check_out: 'asc' }
    });
  }

  async findByPropiedad(propiedad_id: string) {
    return this.prisma.reserva.findMany({ where: { propiedad_id } });
  }

  async update(id: string, data: any) {
    return this.prisma.reserva.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.reserva.delete({ where: { id } });
  }

  // 🐴 --- CABALLO DE TROYA PARA ASEOS --- 🐴
  async obtenerAseos() {
    return await this.prisma.tareasAseo.findMany({
      orderBy: { created_at: 'desc' }
    });
  }

  async crearAseo(data: any) {
    return await this.prisma.tareasAseo.create({
      data: {
        propiedad_id: String(data.propiedad_id),
        empleado_id: String(data.empleado_id),
        urgencia: String(data.urgencia || 'Normal'),
        estado: 'Pendiente',
        tiempo_segundos: 0
      }
    });
  }
}