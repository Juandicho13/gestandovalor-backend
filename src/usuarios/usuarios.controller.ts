import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// El panel solo necesita saber cuántos apartamentos tiene cada quién y cuáles son.
// Traer la propiedad completa arrastra el array de fotos y revienta la respuesta.
const PROPIEDADES_RESUMIDAS = {
  select: { id: true, titulo: true },
};

@Controller('usuarios')
export class UsuariosController {

  constructor(private prisma: PrismaService) { }

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

      const nuevoUsuario = await this.prisma.usuario.create({
        data: dataToCreate,
        include: { propiedades: PROPIEDADES_RESUMIDAS } // Le decimos que nos devuelva los datos con sus apartamentos
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
      return await this.prisma.usuario.findMany({
        include: { propiedades: PROPIEDADES_RESUMIDAS }, // <-- ESTO ENCIENDE LOS CHULITOS DORADOS AL EDITAR
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      // Sin esto el error real se pierde y en Render solo se ve un 500 mudo
      console.error('🔥 Error al obtener usuarios:', error);
      throw new HttpException(
        `Error al obtener usuarios: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 3. LOGIN
  @Post('login')
  async login(@Body() body: any) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { username: body.username, password: body.password },
      // El login se guarda en localStorage; con las fotos completas se pasa del límite del navegador
      include: { propiedades: PROPIEDADES_RESUMIDAS }
    });

    if (!usuario) throw new HttpException('Credenciales incorrectas', HttpStatus.UNAUTHORIZED);

    const { password, ...usuarioSinPass } = usuario;
    return { mensaje: 'Login exitoso', usuario: usuarioSinPass };
  }

  // 4. LATIDO: el panel avisa que el usuario sigue conectado (Radar del Equipo)
  @Post(':id/latido')
  async registrarLatido(@Param('id') id: string, @Body() body: any) {
    try {
      // Al cerrar sesión mandamos activo: false para que salga Offline de una vez
      const sigueConectado = body?.activo !== false;

      await this.prisma.usuario.update({
        where: { id },
        data: { ultima_actividad: sigueConectado ? new Date() : null },
      });

      return { ok: true };
    } catch (error) {
      throw new HttpException('No se pudo registrar la actividad', HttpStatus.BAD_REQUEST);
    }
  }

  // 5. ACTUALIZAR USUARIO Y SUS PROPIEDADES
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

      const usuarioActualizado = await this.prisma.usuario.update({
        where: { id: id },
        data: dataToUpdate,
        include: { propiedades: PROPIEDADES_RESUMIDAS }
      });

      return { mensaje: 'Usuario actualizado', usuario: usuarioActualizado };
    } catch (error) {
      throw new HttpException('Error al actualizar el usuario', HttpStatus.BAD_REQUEST);
    }
  }

  // 6. BORRAR USUARIO
  @Delete(':id')
  async eliminarUsuario(@Param('id') id: string) {
    try {
      await this.prisma.usuario.delete({ where: { id: id } });
      return { mensaje: 'Usuario eliminado correctamente' };
    } catch (error) {
      throw new HttpException('Error al eliminar el usuario', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}