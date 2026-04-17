import { Module } from '@nestjs/common';
import { TarifasService } from './tarifas.service';
import { TarifasController } from './tarifas.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
    controllers: [TarifasController],
    providers: [TarifasService, PrismaService],
})
export class TarifasModule { }
// 👆 La magia está aquí: 'export class TarifasModule'