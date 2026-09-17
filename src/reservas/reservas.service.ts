import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ESTADO_CANCELADA,
  ESTADO_PAGO_EN_PROCESO,
  buscarReservasQueSeCruzan,
  esFechaValida,
  liberarReservasVencidas,
} from './fechas-reserva';

const N8N_WEBHOOK_URL =
  process.env.N8N_WEBHOOK_URL ||
  'https://juanchisolarte.app.n8n.cloud/webhook-test/2cd97a71-18f1-4a6f-b09e-d9ebf2e12a2b';

@Injectable()
export class ReservasService {
  constructor(private prisma: PrismaService) { }

  // --- LO ORIGINAL DE RESERVAS ---
  async create(data: any) {
    // 1. Guardamos la reserva en la base de datos primero
    const nuevaReserva = await this.prisma.reserva.create({ data });

    // 2. Le avisamos a n8n (WhatsApp) en segundo plano
    try {
      fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evento: 'NUEVA_RESERVA',
          reserva_id: nuevaReserva.id,
          huesped_nombre: nuevaReserva.huesped_nombre,
          huesped_telefono: nuevaReserva.huesped_telefono,
          huesped_email: nuevaReserva.huesped_email,
          monto_total: nuevaReserva.monto_total,
          estado_reserva: nuevaReserva.estado_reserva,
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

  // Panel: no mostramos canceladas ni pagos que aún no se completan
  async findAll() {
    await liberarReservasVencidas(this.prisma);
    return this.prisma.reserva.findMany({
      where: { estado_reserva: { notIn: [ESTADO_CANCELADA, ESTADO_PAGO_EN_PROCESO] } },
      orderBy: { check_out: 'asc' }
    });
  }

  async findByPropiedad(propiedad_id: string) {
    await liberarReservasVencidas(this.prisma);
    return this.prisma.reserva.findMany({
      where: {
        propiedad_id,
        estado_reserva: { notIn: [ESTADO_CANCELADA, ESTADO_PAGO_EN_PROCESO] },
      },
    });
  }

  // Público (página de la suite): solo fechas ocupadas, sin datos del huésped
  async ocupacionPublica(propiedad_id: string) {
    await liberarReservasVencidas(this.prisma);
    return this.prisma.reserva.findMany({
      where: { propiedad_id, estado_reserva: { notIn: [ESTADO_CANCELADA, ESTADO_PAGO_EN_PROCESO] } },
      select: { check_in: true, check_out: true },
    });
  }

  // Público (resultados de búsqueda): ids de propiedades ocupadas en esas fechas
  async propiedadesOcupadas(llegada: string, salida: string) {
    if (!esFechaValida(llegada) || !esFechaValida(salida) || salida <= llegada) {
      throw new BadRequestException('Fechas inválidas');
    }
    const cruces = await buscarReservasQueSeCruzan(this.prisma, llegada, salida);
    return { propiedades: [...new Set(cruces.map((r) => r.propiedad_id))] };
  }

  async update(id: string, data: any) {
    return this.prisma.reserva.update({ where: { id }, data });
  }

  // Borrado libre desde el panel: primero los pagos asociados y luego la reserva.
  // El registro del cobro sigue disponible en el panel de Bold con su referencia.
  async remove(id: string) {
    const [, reserva] = await this.prisma.$transaction([
      this.prisma.pago.deleteMany({ where: { reservaId: id } }),
      this.prisma.reserva.delete({ where: { id } }),
    ]);
    return reserva;
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