import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Publico, Roles } from '../auth/seguridad';
import { JwtService } from '@nestjs/jwt';
import { Throttle } from '@nestjs/throttler';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

@Controller('usuarios')
export class UsuariosController {

  constructor(private jwt: JwtService) { }

  // 1. CREAR USUARIO Y VINCULAR PROPIEDADES
  @Roles('ADMIN')
  @Post()
  async crearUsuario(@Body() body: any) {
    try {
      const dataToCreate: any = {
        nombre: body.nombre,
        username: body.username,
        // Las contraseñas nuevas nacen cifradas. Las que ya existen siguen
        // funcionando igual: el login acepta las dos formas.
        password: await bcrypt.hash(String(body.password || ''), 10),
        rol: body.rol,
      };

      // LA MAGIA: Si es propietario y seleccionaste apartamentos, los vincula en la BD
      if (body.rol === 'PROPIETARIO' && body.propiedadesIds && body.propiedadesIds.length > 0) {
        dataToCreate.propiedades = {
          connect: body.propiedadesIds.map((id: string) => ({ id }))
        };
      }

      const nuevoUsuario = await prisma.usuario.create({
        data: dataToCreate,
        include: { propiedades: true } // Le decimos que nos devuelva los datos con sus apartamentos
      });
      return { mensaje: 'Usuario creado con éxito', usuario: nuevoUsuario };
    } catch (error) {
      throw new HttpException('El usuario ya existe o los datos son inválidos', HttpStatus.BAD_REQUEST);
    }
  }

  // 2. OBTENER TODOS (CON SUS PROPIEDADES INCLUIDAS)
  @Roles('ADMIN', 'AMA_LLAVES')
  @Get()
  async obtenerUsuarios() {
    try {
      // Nunca devolvemos 'password'. Antes este endpoint regalaba las claves de todo el equipo.
      return await prisma.usuario.findMany({
        select: {
          id: true, nombre: true, username: true, rol: true, createdAt: true,
          propiedades: true, // <-- ESTO ENCIENDE LOS CHULITOS DORADOS AL EDITAR
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      throw new HttpException('Error al obtener usuarios', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 3. LOGIN
  @Publico()
  // Máximo 8 intentos por minuto desde la misma IP
  @Throttle({ default: { limit: 8, ttl: 60000 } })
  @Post('login')
  async login(@Body() body: any) {
    const usuario = await prisma.usuario.findUnique({
      where: { username: String(body?.username || '') },
      include: { propiedades: true }
    });

    // Acepta las dos formas: las contraseñas viejas (texto plano) y las nuevas (cifradas)
    const guardada = usuario?.password || '';
    const escrita = String(body?.password || '');
    const esHash = /^\$2[aby]\$/.test(guardada);
    const correcta = usuario
      ? (esHash ? await bcrypt.compare(escrita, guardada) : escrita === guardada && escrita !== '')
      : false;

    // Mismo mensaje exista o no el usuario: no le damos pistas a nadie
    if (!correcta) throw new HttpException('Usuario o contraseña incorrectos', HttpStatus.UNAUTHORIZED);

    const token = await this.jwt.signAsync(
      { sub: usuario!.id, rol: usuario!.rol, nombre: usuario!.nombre },
      { secret: process.env.JWT_SECRET, expiresIn: '12h' },
    );

    const { password, ...usuarioSinPass } = usuario!;
    return { mensaje: 'Login exitoso', token, usuario: usuarioSinPass };
  }

  // 4. ACTUALIZAR USUARIO Y SUS PROPIEDADES
  @Roles('ADMIN')
  @Patch(':id')
  async actualizarUsuario(@Param('id') id: string, @Body() body: any) {
    try {
      const dataToUpdate: any = {
        nombre: body.nombre,
        username: body.username,
        rol: body.rol,
      };

      if (body.password) dataToUpdate.password = await bcrypt.hash(String(body.password), 10);

      // LA MAGIA: Si editas a un propietario y cambias los apartamentos, Prisma los actualiza
      if (body.rol === 'PROPIETARIO' && Array.isArray(body.propiedadesIds)) {
        dataToUpdate.propiedades = {
          set: body.propiedadesIds.map((id: string) => ({ id })) // 'set' reemplaza la lista vieja por la nueva
        };
      } else {
        // Si lo cambiaste de Propietario a Aseo, le quita los apartamentos
        dataToUpdate.propiedades = { set: [] };
      }

      const usuarioActualizado = await prisma.usuario.update({
        where: { id: id },
        data: dataToUpdate,
        include: { propiedades: true }
      });

      return { mensaje: 'Usuario actualizado', usuario: usuarioActualizado };
    } catch (error) {
      throw new HttpException('Error al actualizar el usuario', HttpStatus.BAD_REQUEST);
    }
  }

  // 5. BORRAR USUARIO
  @Roles('ADMIN')
  @Delete(':id')
  async eliminarUsuario(@Param('id') id: string) {
    try {
      await prisma.usuario.delete({ where: { id: id } });
      return { mensaje: 'Usuario eliminado correctamente' };
    } catch (error) {
      throw new HttpException('Error al eliminar el usuario', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}