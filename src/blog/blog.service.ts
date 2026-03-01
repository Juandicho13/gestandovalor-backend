import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; 

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.articuloBlog.create({
      data: {
        titulo: data.titulo,
        categoria: data.categoria,
        tiempo_lectura: data.tiempo_lectura,
        foto_url: data.foto_url, 
        contenido: data.contenido,
        estado: data.estado,
      }
    });
  }

  findAll() {
    return this.prisma.articuloBlog.findMany({
      orderBy: { created_at: 'desc' } 
    });
  }

  findOne(id: string) {
    return this.prisma.articuloBlog.findUnique({
      where: { id }
    });
  }
}