import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReservasService {
  constructor(private prisma: PrismaService) { }

  // --- LO ORIGINAL DE RESERVAS ---
  async create(data: any) {
    // 1. Guardamos la reserva en la base de datos primero
    const nuevaReserva = await this.prisma.reserva.create({ data });

    // 2. Le avisamos a n8n (WhatsApp) en segundo plano
    try {
      fetch('https://juanchisolarte.app.n8n.cloud/webhook-test/2cd97a71-18f1-4a6f-b09e-d9ebf2e12a2b', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evento: 'NUEVA_RESERVA',
          reserva_id: nuevaReserva.id,
          huesped_nombre: nuevaReserva.huesped_nombre,
          check_in: nuevaReserva.check_in,
          check_out: nuevaReserva.check_out,
          cantidad_huespedes: nuevaReserva.cantidad_huespedes,
          propiedad_id: nuevaReserva.propiedad_id
        })
      }).catch(err => console.error('Error de red enviando a n8n:', err));
    } catch (error) {
      console.error('Error general enviando webhook a n8n:', error);
    }

    // 3. Devolvemos la reserva al calendario para que se pinte
    return nuevaReserva;
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

  // ✨ FUNCIÓN PARA CAMBIAR EL EMPLEADO ✨
  async actualizarAseo(id: string, data: any) {
    return await this.prisma.tareasAseo.update({
      where: { id },
      data: { empleado_id: String(data.empleado_id) }
    });
  }

  // ✨ FUNCIÓN PARA BORRAR TAREAS FANTASMA ✨
  async eliminarAseo(id: string) {
    return await this.prisma.tareasAseo.delete({
      where: { id }
    });
  }
}