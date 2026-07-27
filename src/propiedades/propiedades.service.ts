import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class PropiedadesService {
  private supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_KEY as string,
  );

  constructor(private prisma: PrismaService) { }

  async create(data: any) {
    return await this.prisma.propiedad.create({ data });
  }

  async findAll() {
    return await this.prisma.propiedad.findMany({
      orderBy: { created_at: 'desc' }
    });
  }

  async findOne(id: string) {
    return await this.prisma.propiedad.findUnique({
      where: { id }
    });
  }

  // ✨ LA ÚNICA FUNCIÓN UPDATE (Sirve para todo: links, precios, textos, E INVENTARIO) ✨
  async update(id: string, data: any) {
    try {
      return await this.prisma.propiedad.update({
        where: { id },
        data
      });
    } catch (error) {
      console.error("Error al actualizar la propiedad:", error);
      throw new HttpException('Error al actualizar la propiedad', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async obtenerCiudades() {
    return this.prisma.propiedad.findMany({
      select: {
        ciudad: true,
        departamento: true,
      },
      distinct: ['ciudad', 'departamento'],
    });
  }


  async remove(id: string) {
    return await this.prisma.propiedad.delete({
      where: { id }
    });
  }

  // ✨ NUEVA FUNCIÓN OPTIMIZADA PARA RESULTADOS ✨
  async obtenerResultadosBusqueda() {
    const propiedades = await this.prisma.propiedad.findMany({
      select: {
        id: true,
        titulo: true,
        ciudad: true,
        departamento: true,
        tipo_propiedad: true,
        precio_noche: true,
        camas: true,
        banos: true,
        capacidad_huespedes: true,
        tarifa_aseo: true,
        huespedes_base: true,
        precio_huesped_extra: true,
        precio_mascota: true,
        fotos: true,
        tarifas_especiales: {
          select: { fecha_inicio: true, fecha_fin: true, precio: true }
        }
      },
    });

    return propiedades.map((prop) => ({
      ...prop,
      fotos: prop.fotos && prop.fotos.length > 0 ? [prop.fotos[0]] : [],
    }));
  }
  // Devuelve una foto como imagen binaria en vez de base64 dentro del JSON
  async obtenerFoto(id: string, indice: number) {
    const prop = await this.prisma.propiedad.findUnique({
      where: { id },
      select: { fotos: true },
    });


    if (!prop || !prop.fotos || !prop.fotos[indice]) {
      throw new HttpException('Foto no encontrada', HttpStatus.NOT_FOUND);
    }

    const dataUrl = prop.fotos[indice];
    const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);

    if (!match) {
      throw new HttpException('Formato de foto inválido', HttpStatus.BAD_REQUEST);
    }

    return { mime: match[1], buffer: Buffer.from(match[2], 'base64') };
  }
  // Detalle de una suite sin las fotos pesadas — solo manda cuántas hay
  async obtenerDetalleSuite(id: string) {
    const prop = await this.prisma.propiedad.findUnique({ where: { id } });

    if (!prop) {
      throw new HttpException('Propiedad no encontrada', HttpStatus.NOT_FOUND);
    }

    return prop;
  }
  // Lista completa para el panel admin, sin las fotos en base64
  async obtenerListaAdmin() {
    return this.prisma.propiedad.findMany({
      orderBy: { created_at: 'desc' },
    });
  }
  // Recibe una imagen en base64, la sube a Storage y devuelve su URL pública
  async subirFoto(dataUrl: string, propiedadId?: string) {
    const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!match) {
      throw new HttpException(
        'Formato de imagen no válido. Debe ser JPG, PNG o WEBP.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const mime = match[1];
    const buffer = Buffer.from(match[2], 'base64');
    const extension = mime.split('/')[1].replace('jpeg', 'jpg');
    const carpeta = propiedadId || 'sin-asignar';
    const nombre = `${carpeta}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

    const { error } = await this.supabase.storage
      .from('fotos-propiedades')
      .upload(nombre, buffer, { contentType: mime });

    if (error) {
      throw new HttpException(
        `No se pudo subir la foto: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const { data } = this.supabase.storage
      .from('fotos-propiedades')
      .getPublicUrl(nombre);

    return { url: data.publicUrl };
  }
  // Emite un permiso temporal para que el navegador suba la foto directo a Storage
  async crearUrlSubida(extension: string, propiedadId?: string) {
    const permitidas = ['jpg', 'jpeg', 'png', 'webp'];
    const ext = (extension || 'webp').toLowerCase().replace('jpeg', 'jpg');

    if (!permitidas.includes(ext)) {
      throw new HttpException(
        'Formato no permitido. Solo JPG, PNG o WEBP.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const carpeta = propiedadId || 'sin-asignar';
    const nombre = `${carpeta}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { data, error } = await this.supabase.storage
      .from('fotos-propiedades')
      .createSignedUploadUrl(nombre);

    if (error) {
      throw new HttpException(
        `No se pudo preparar la subida: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const { data: publico } = this.supabase.storage
      .from('fotos-propiedades')
      .getPublicUrl(nombre);

    return { signedUrl: data.signedUrl, publicUrl: publico.publicUrl };
  }

}