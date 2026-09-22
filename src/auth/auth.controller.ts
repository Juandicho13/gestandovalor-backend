import {
  Controller,
  Post,
  Get,
  Body,
  HttpException,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Throttle } from '@nestjs/throttler';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { Publico } from './seguridad';

const prisma = new PrismaClient();

/**
 * Compara la contraseña escrita contra la guardada.
 * Acepta las dos formas para no romper a nadie:
 *  - Si la guardada es un hash de bcrypt, compara con bcrypt.
 *  - Si sigue en texto plano (las que ya existen), compara directo.
 * Así las contraseñas actuales siguen funcionando igual y las nuevas ya nacen cifradas.
 */
async function claveCorrecta(escrita: string, guardada: string): Promise<boolean> {
  if (!escrita || !guardada) return false;
  if (guardada.startsWith('$2a$') || guardada.startsWith('$2b$') || guardada.startsWith('$2y$')) {
    return bcrypt.compare(escrita, guardada);
  }
  return escrita === guardada;
}

@Controller('auth')
export class AuthController {
  constructor(private jwt: JwtService) { }

  @Publico()
  // Máximo 8 intentos por minuto desde la misma IP: frena el probar contraseñas a lo bruto
  @Throttle({ default: { limit: 8, ttl: 60000 } })
  @Post('login')
  async login(@Body() body: any) {
    const usuario = await prisma.usuario.findUnique({
      where: { username: String(body?.username || '') },
      include: { propiedades: { select: { id: true, titulo: true } } },
    });

    // Mismo mensaje exista o no el usuario: no le regalamos pistas a nadie
    if (!usuario || !(await claveCorrecta(String(body?.password || ''), usuario.password))) {
      throw new HttpException('Usuario o contraseña incorrectos', HttpStatus.UNAUTHORIZED);
    }

    const token = await this.jwt.signAsync(
      { sub: usuario.id, rol: usuario.rol, nombre: usuario.nombre },
      { secret: process.env.JWT_SECRET, expiresIn: '12h' },
    );

    const { password, ...usuarioSinClave } = usuario;
    return { mensaje: 'Login exitoso', token, usuario: usuarioSinClave };
  }

  /** El frontend llama esto al abrir cada panel para saber si la sesión sigue viva. */
  @Get('yo')
  async yo(@Req() req: any) {
    return { usuario: req.usuario };
  }
}