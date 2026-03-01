import { Module } from '@nestjs/common';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { PrismaService } from '../prisma/prisma.service'; // <-- Importamos directamente el Servicio

@Module({
  controllers: [BlogController],
  providers: [BlogService, PrismaService], // <-- Lo agregamos aquí en los providers
})
export class BlogModule {}