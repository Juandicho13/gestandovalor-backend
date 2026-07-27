import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) { }

  create(data: any) {
    return this.prisma.articuloBlog.create({
      data: {
        titulo: data.titulo,
        categoria: data.categoria,
        tiempo_lectura: data.tiempo_lectura,
        foto_url: data.foto_url,
        contenido: data.contenido,
        estado: data.estado,
      },
    });
  }

  findAll() {
    return this.prisma.articuloBlog.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  // Para la lista del blog: sin "contenido", ahí es donde viven las fotos incrustadas del artículo completo
  findAllResumen() {
    return this.prisma.articuloBlog.findMany({
      select: {
        id: true,
        titulo: true,
        categoria: true,
        tiempo_lectura: true,
        foto_url: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.articuloBlog.findUnique({
      where: { id: Number(id) }
    });
  }

  update(id: string, updateData: any) {
    return this.prisma.articuloBlog.update({
      where: { id: Number(id) },
      data: updateData,
    });
  }

  remove(id: string) {
    return this.prisma.articuloBlog.delete({
      where: { id: Number(id) }
    });
  }
}