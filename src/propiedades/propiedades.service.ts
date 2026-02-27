import { Injectable } from '@nestjs/common';
import { CreatePropiedadeDto } from './dto/create-propiedade.dto';
import { UpdatePropiedadeDto } from './dto/update-propiedade.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PropiedadesService {
  // Inyectamos Prisma para poder hablar con la base de datos
  constructor(private prisma: PrismaService) {}

  async create(createPropiedadeDto: any) {
    return this.prisma.propiedad.create({
      data: createPropiedadeDto,
    });
  }

  async findAll() {
    return this.prisma.propiedad.findMany({
      include: {
        propietario: {
          select: { nombre: true, username: true } // Trae datos básicos del dueño
        }
      }
    });
  }

  async findOne(id: string) {
    return this.prisma.propiedad.findUnique({
      where: { id },
      include: {
        inventario: true // Trae también el inventario de esta propiedad
      }
    });
  }

  async update(id: string, updatePropiedadeDto: any) {
    return this.prisma.propiedad.update({
      where: { id },
      data: updatePropiedadeDto,
    });
  }

  async remove(id: string) {
    return this.prisma.propiedad.delete({
      where: { id },
    });
  }
}