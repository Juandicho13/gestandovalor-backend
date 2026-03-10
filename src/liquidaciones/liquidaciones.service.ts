import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LiquidacionesService {
  constructor(private prisma: PrismaService) {}

  async subirLiquidacion(body: any) {
    try {
      // 1. Guardamos el nuevo reporte PDF
      const nuevaLiquidacion = await this.prisma.liquidacion.create({
        data: {
          propiedad_id: body.propiedad_id,
          mes_anio: body.mes_anio,
          archivo_pdf: body.archivo_pdf,
          nombre_archivo: body.nombre_archivo,
        }
      });

      // 2. Regla de los 3 meses (Borrado automático)
      const historial = await this.prisma.liquidacion.findMany({
        where: { propiedad_id: body.propiedad_id },
        orderBy: { created_at: 'desc' },
        select: { id: true }
      });

      if (historial.length > 3) {
        const idsParaBorrar = historial.slice(3).map(liq => liq.id);
        await this.prisma.liquidacion.deleteMany({
          where: { id: { in: idsParaBorrar } }
        });
      }

      return { mensaje: 'Liquidación guardada exitosamente', liquidacion: nuevaLiquidacion };
    } catch (error) {
      console.error("💥 Error al guardar liquidacion:", error);
      throw new HttpException('Error al procesar la liquidación', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async obtenerPorPropiedad(propiedadId: string) {
    try {
      return await this.prisma.liquidacion.findMany({
        where: { propiedad_id: propiedadId },
        orderBy: { created_at: 'desc' }
      });
    } catch (error) {
      throw new HttpException('Error al obtener liquidaciones', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  findAll() {
    return this.prisma.liquidacion.findMany({
      include: {
        propiedad: {
          include: { propietario: { select: { nombre: true } } }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  // 👇 LA PIEZA FALTANTE PARA QUE NO EXPLOTE EL SERVIDOR 👇
  async remove(id: string) {
    try {
      return await this.prisma.liquidacion.delete({
        where: { id }
      });
    } catch (error) {
      throw new HttpException('Error al eliminar la liquidación', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}