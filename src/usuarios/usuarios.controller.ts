import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Controller('usuarios')
export class UsuariosController {

  // 1. CREAR USUARIO (El que ya tenías)
  @Post()
  async crearUsuario(@Body() body: any) {
    try {
      const nuevoUsuario = await prisma.usuario.create({
        data: {
          nombre: body.nombre,
          username: body.username,
          password: body.password, 
          rol: body.rol,
        },
      });
      return { mensaje: 'Usuario creado con éxito', usuario: nuevoUsuario };
    } catch (error) {
      throw new HttpException('El usuario ya existe o los datos son inválidos', HttpStatus.BAD_REQUEST);
    }
  }

  // 2. OBTENER TODOS LOS USUARIOS (La magia para que aparezcan en la tabla)
  @Get()
  async obtenerUsuarios() {
    try {
      return await prisma.usuario.findMany({
        orderBy: { createdAt: 'desc' } // Los ordena del más nuevo al más viejo
      });
    } catch (error) {
      throw new HttpException('Error al obtener usuarios', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ... tu código de crear y obtener ...

  // NUEVA PUERTA DE ENTRADA: LOGIN
  @Post('login')
  async login(@Body() body: any) {
    const usuario = await prisma.usuario.findFirst({
      where: { 
        username: body.username,
        password: body.password 
      }
    });

    if (!usuario) {
      throw new HttpException('Credenciales incorrectas', HttpStatus.UNAUTHORIZED);
    }

    // Si todo está bien, devolvemos el usuario pero SIN la contraseña por seguridad
    const { password, ...usuarioSinPass } = usuario;
    
    return {
      mensaje: 'Login exitoso',
      usuario: usuarioSinPass
    };
  }

  // ... tus funciones de patch y delete ...

  // 3. ACTUALIZAR USUARIO (Para que funcione el botón "Editar")
  @Patch(':id')
  async actualizarUsuario(@Param('id') id: string, @Body() body: any) {
    try {
      const dataToUpdate: any = {
        nombre: body.nombre,
        username: body.username,
        rol: body.rol,
      };

      // Si en el formulario escribiste una contraseña nueva, la actualiza. Si no, la deja intacta.
      if (body.password) {
        dataToUpdate.password = body.password;
      }

      const usuarioActualizado = await prisma.usuario.update({
        where: { id: id },
        data: dataToUpdate,
      });

      return { mensaje: 'Usuario actualizado', usuario: usuarioActualizado };
    } catch (error) {
      throw new HttpException('Error al actualizar el usuario', HttpStatus.BAD_REQUEST);
    }
  }

  // 4. BORRAR USUARIO (Para que funcione el botón "Eliminar")
  @Delete(':id')
  async eliminarUsuario(@Param('id') id: string) {
    try {
      await prisma.usuario.delete({
        where: { id: id }
      });
      return { mensaje: 'Usuario eliminado correctamente' };
    } catch (error) {
      throw new HttpException('Error al eliminar el usuario', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  
}