import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Controller('auth')
export class AuthController {
  
  @Post('login')
  async login(@Body() body: any) {
    // 1. Buscamos si existe alguien con ese username
    const usuario = await prisma.usuario.findUnique({
      where: { username: body.username },
    });

    // 2. Si no existe, o la contraseña no es igual, le cerramos la puerta
    if (!usuario || usuario.password !== body.password) {
      throw new HttpException('Credenciales incorrectas', HttpStatus.UNAUTHORIZED);
    }

    // 3. Si todo está bien, le damos la bienvenida y le pasamos su ROL
    return {
      mensaje: 'Login exitoso',
      rol: usuario.rol,
      nombre: usuario.nombre
    };
  }
}