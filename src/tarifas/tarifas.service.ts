import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TarifasService { // 👈 ¡Aquí está el export que faltaba!
    constructor(private prisma: PrismaService) { }

    async create(data: any) {
        return this.prisma.tarifaEspecial.create({
            data: {
                propiedad_id: data.propiedad_id,
                fecha_inicio: new Date(data.fecha_inicio),
                fecha_fin: new Date(data.fecha_fin),
                precio: Number(data.precio),
            },
        });
    }

    async findByPropiedad(propiedadId: string) {
        return this.prisma.tarifaEspecial.findMany({
            where: { propiedad_id: propiedadId },
            orderBy: { fecha_inicio: 'asc' },
        });
    }
}