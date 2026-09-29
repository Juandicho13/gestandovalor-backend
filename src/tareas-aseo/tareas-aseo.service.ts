import { Injectable, HttpException, HttpStatus, NotFoundException, ForbiddenException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';

const BUCKET = 'fotos-propiedades';

@Injectable()
export class TareasAseoService {
  private supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_KEY as string,
  );

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
    return await this.prisma.tareasAseo.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        propiedad: { select: { id: true, titulo: true, ciudad: true } },
        empleado: { select: { id: true, nombre: true } },
      },
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

  // El equipo de aseo solo actualiza sus propios aseos y no puede aprobar la inspección
  async revisarCambioDelEmpleado(id: string, data: any, empleadoId: string) {
    const tarea = await this.prisma.tareasAseo.findUnique({
      where: { id },
      select: { empleado_id: true, estado: true },
    });
    if (!tarea || tarea.empleado_id !== empleadoId) {
      throw new ForbiddenException('Este aseo no está asignado a ti');
    }
    if (String(tarea.estado).toLowerCase() === 'inspeccionada') {
      throw new ForbiddenException('Este aseo ya fue inspeccionado');
    }

    const permitidos = ['estado', 'tiempo_segundos', 'completed_at', 'reporte_empleado', 'novedad_reportada', 'fotos'];
    const prohibidos = Object.keys(data || {}).filter((campo) => !permitidos.includes(campo));
    if (prohibidos.length) {
      throw new ForbiddenException(`No tienes permiso para cambiar: ${prohibidos.join(', ')}`);
    }

    const estadosDelEmpleado = ['pendiente', 'en progreso', 'en pausa', 'completada'];
    if (data?.estado !== undefined && !estadosDelEmpleado.includes(String(data.estado).toLowerCase())) {
      throw new ForbiddenException('Solo la ama de llaves puede poner el aseo en ese estado');
    }
  }

  // ✨ Elimina el reporte de novedad (texto y fotos) sin borrar la tarea de aseo
  async eliminarNovedad(id: string) {
    const tarea = await this.prisma.tareasAseo.findUnique({
      where: { id },
      select: { id: true, fotos: true },
    });
    if (!tarea) throw new NotFoundException('La tarea no existe');

    const actualizada = await this.prisma.tareasAseo.update({
      where: { id },
      data: { novedad_reportada: null, fotos: [] },
    });

    // Las fotos se borran de Storage en segundo plano; si falla, el reporte ya quedó eliminado
    const rutas = (tarea.fotos || [])
      .map((url) => url.split(`/object/public/${BUCKET}/`)[1])
      .filter((ruta): ruta is string => Boolean(ruta))
      .map((ruta) => decodeURIComponent(ruta.split('?')[0]));

    if (rutas.length > 0) {
      this.supabase.storage
        .from(BUCKET)
        .remove(rutas)
        .then(({ error }) => {
          if (error) console.error('Novedades: no se pudieron borrar las fotos', error.message);
        })
        .catch((error) => console.error('Novedades: error borrando fotos', error));
    }

    return actualizada;
  }
}