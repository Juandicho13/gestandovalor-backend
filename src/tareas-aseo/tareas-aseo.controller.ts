import { Controller, Get } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Controller('tareas-aseo')
export class TareasAseoController {
  
  @Get()
  async obtenerTareas() {
    // Busca todas las tareas y trae también los datos de la propiedad a la que pertenecen
    return await prisma.tareasAseo.findMany({
      include: {
        propiedad: true, 
      },
      orderBy: { created_at: 'desc' }
    });
  }
}