import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Controller('usuarios')
export class UsuariosController {

  // 1. CREAR USUARIO Y VINCULAR PROPIEDADES
  @Post()
  async crearUsuario(@Body() body: any) {
    try {
      const dataToCreate: any = {
        nombre: body.nombre,
        username: body.username,
        password: body.password,
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
  @Get()
  async obtenerUsuarios() {
    try {
      return await prisma.usuario.findMany({
        include: { propiedades: true }, // <-- ESTO ENCIENDE LOS CHULITOS DORADOS AL EDITAR
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      throw new HttpException('Error al obtener usuarios', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 3. LOGIN
  @Post('login')
  async login(@Body() body: any) {
    const usuario = await prisma.usuario.findFirst({
      where: { username: body.username, password: body.password },
      include: { propiedades: true }
    });

    if (!usuario) throw new HttpException('Credenciales incorrectas', HttpStatus.UNAUTHORIZED);

    const { password, ...usuarioSinPass } = usuario;
    return { mensaje: 'Login exitoso', usuario: usuarioSinPass };
  }

  // 4. ACTUALIZAR USUARIO Y SUS PROPIEDADES
  @Patch(':id')
  async actualizarUsuario(@Param('id') id: string, @Body() body: any) {
    try {
      const dataToUpdate: any = {
        nombre: body.nombre,
        username: body.username,
        rol: body.rol,
      };

      if (body.password) dataToUpdate.password = body.password;

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