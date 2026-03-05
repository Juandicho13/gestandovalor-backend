import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PropiedadesService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    try {
      return await this.prisma.propiedad.create({
        data: {
          ...data,
        },
      });
    } catch (error) {
      throw new HttpException('Error al crear la propiedad', HttpStatus.BAD_REQUEST);
    }
  }

  async findAll() {
    return await this.prisma.propiedad.findMany({
      orderBy: { created_at: 'desc' }
    });
  }

  async findOne(id: string) {
    return await this.prisma.propiedad.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: any) {
    try {
      return await this.prisma.propiedad.update({
        where: { id },
        data: {
          ...data,
        },
      });
    } catch (error) {
      // 👇 AQUÍ PUSIMOS LA LUPA PARA CAZAR EL ERROR EN RENDER 👇
      console.log("💥 ERROR PRISMA AL ACTUALIZAR:", error);
      throw new HttpException('Error al actualizar la propiedad', HttpStatus.BAD_REQUEST);
    }
  }

  async remove(id: string) {
    return await this.prisma.propiedad.delete({
      where: { id },
    });
  }
}