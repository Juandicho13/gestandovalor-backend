import { Injectable } from '@nestjs/common';
import { CreateProspectoDto } from './dto/create-prospecto.dto';
import { UpdateProspectoDto } from './dto/update-prospecto.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProspectosService {
  constructor(private prisma: PrismaService) { }

  create(createProspectoDto: CreateProspectoDto) {
    return this.prisma.prospecto.create({
      data: createProspectoDto as any
    });
  }

  findAll() {
    return this.prisma.prospecto.findMany();
  }

  findOne(id: string) {
    return this.prisma.prospecto.findUnique({
      where: { id }
    });
  }

  update(id: string, updateProspectoDto: UpdateProspectoDto) {
    return this.prisma.prospecto.update({
      where: { id },
      data: updateProspectoDto as any,
    });
  }

  remove(id: string) {
    return this.prisma.prospecto.delete({
      where: { id },
    });
  }
}