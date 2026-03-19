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
      // ✨ ¡ELIMINAMOS EL INCLUDE DE INVENTARIO PORQUE AHORA ES UN JSON NATIVO! ✨
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

  async remove(id: string) {
    return await this.prisma.propiedad.delete({
      where: { id }
    });
  }
}