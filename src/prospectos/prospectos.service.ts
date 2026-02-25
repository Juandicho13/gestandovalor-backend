import { Injectable } from '@nestjs/common';
import { CreateProspectoDto } from './dto/create-prospecto.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProspectosService {
  constructor(private prisma: PrismaService) {}

  async create(createProspectoDto: CreateProspectoDto) {
    const nuevoProspecto = await this.prisma.prospecto.create({
      data: createProspectoDto,
    });
    
    return {
      mensaje: '¡Propietario guardado con éxito!',
      data: nuevoProspecto,
    };
  }

  findAll() {
    return this.prisma.prospecto.findMany();
  }
}