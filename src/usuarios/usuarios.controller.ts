import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Controller('usuarios')
export class UsuariosController {
  
  @Post()
  async crearUsuario(@Body() body: any) {
    try {
      // Intentamos guardar el empleado en la base de datos
      const nuevoUsuario = await prisma.usuario.create({
        data: {
          nombre: body.nombre,
          username: body.username,
          password: body.password, // Nota: En una app de producción, esto se encriptaría
          rol: body.rol,
        },
      });
      return { mensaje: 'Empleado creado con éxito', usuario: nuevoUsuario };
      
    } catch (error) {
      // Si el username ya existe, Prisma lanzará un error y lo atrapamos aquí
      throw new HttpException('El usuario ya existe o los datos son inválidos', HttpStatus.BAD_REQUEST);
    }
  }
}