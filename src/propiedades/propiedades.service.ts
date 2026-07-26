import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PropiedadesService {
  constructor(private prisma: PrismaService) { }

  async create(data: any) {
    return await this.prisma.propiedad.create({ data });
  }

  async findAll() {
    return await this.prisma.propiedad.findMany({
      orderBy: { created_at: 'desc' }
    });
  }

  async findOne(id: string) {
    return await this.prisma.propiedad.findUnique({
      where: { id }
    });
  }

  // ✨ LA ÚNICA FUNCIÓN UPDATE (Sirve para todo: links, precios, textos, E INVENTARIO) ✨
  async update(id: string, data: any) {
    try {
      return await this.prisma.propiedad.update({
        where: { id },
        data
      });
    } catch (error) {
      console.error("Error al actualizar la propiedad:", error);
      throw new HttpException('Error al actualizar la propiedad', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async obtenerCiudades() {
    return this.prisma.propiedad.findMany({
      select: {
        ciudad: true,
        departamento: true,
      },
      distinct: ['ciudad', 'departamento'],
    });
  }


  async remove(id: string) {
    return await this.prisma.propiedad.delete({
      where: { id }
    });
  }

  // ✨ NUEVA FUNCIÓN OPTIMIZADA PARA RESULTADOS ✨
  async obtenerResultadosBusqueda() {
    const propiedades = await this.prisma.propiedad.findMany({
      select: {
        id: true,
        titulo: true,
        ciudad: true,
        departamento: true,
        tipo_propiedad: true,
        precio_noche: true,
        camas: true,
        banos: true,
        capacidad_huespedes: true,
        fotos: true,
        tarifa_aseo: true,
        huespedes_base: true,
        precio_huesped_extra: true,
        precio_mascota: true,
        tarifas_especiales: {
          select: { fecha_inicio: true, fecha_fin: true, precio: true }
        }
      },
    });

    return propiedades.map(prop => ({
      ...prop,
      fotos: prop.fotos && prop.fotos.length > 0 ? [prop.fotos[0]] : [],
    }));
  }

}