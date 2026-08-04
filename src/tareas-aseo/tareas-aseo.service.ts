import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createClient } from '@supabase/supabase-js';

// Bucket compartido con las fotos de propiedades; las novedades viven en su propia carpeta
const BUCKET_FOTOS = 'fotos-propiedades';
const CARPETA_NOVEDADES = 'novedades';

// Solo dejamos escribir estas columnas desde el PATCH genérico
const CAMPOS_EDITABLES = [
  'empleado_id',
  'urgencia',
  'estado',
  'tiempo_segundos',
  'reporte_empleado',
  'novedad_reportada',
  'novedad_fotos',
  'novedad_estado',
  'iniciada_at',
  'completed_at',
];

// Lo que necesita el frontend para saber de qué apartamento habla cada tarea o novedad
const DATOS_RELACIONADOS = {
  propiedad: {
    select: {
      id: true,
      titulo: true,
      direccion: true,
      ciudad: true,
      tipo_propiedad: true,
      // Sin 'fotos': el radar consulta este endpoint cada 30 segundos y las
      // propiedades viejas guardan las imágenes en base64. Los paneles ya
      // resuelven la foto desde /propiedades.
    },
  },
  empleado: {
    select: { id: true, nombre: true, rol: true },
  },
};

@Injectable()
export class TareasAseoService {
  private supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_KEY as string,
  );

  constructor(private prisma: PrismaService) { }

  async create(data: any) {
    try {
      // Guardado crudo, directo y sin relaciones complejas que fallen
      const nuevaTarea = await this.prisma.tareasAseo.create({
        data: {
          propiedad_id: String(data.propiedad_id),
          empleado_id: String(data.empleado_id),
          urgencia: String(data.urgencia || 'Normal'),
          estado: 'Pendiente',
          tiempo_segundos: 0
        }
      });
      return nuevaTarea;
    } catch (error) {
      console.error("🔥 Error forzado en base de datos:", error);
      // Si falla, ahora sí le avisará al frontend en lugar de decir "Todo bien"
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAll() {
    return await this.prisma.tareasAseo.findMany({
      include: DATOS_RELACIONADOS,
      orderBy: { created_at: 'desc' }
    });
  }

  async findByEmpleado(empleado_id: string) {
    return await this.prisma.tareasAseo.findMany({
      where: { empleado_id: String(empleado_id) },
      include: DATOS_RELACIONADOS,
      orderBy: { created_at: 'desc' }
    });
  }

  async update(id: string, data: any) {
    const cambios: any = {};
    for (const campo of CAMPOS_EDITABLES) {
      if (data[campo] !== undefined) cambios[campo] = data[campo];
    }

    // Si la limpieza arranca y nadie mandó la hora, la ponemos nosotros
    if (cambios.estado === 'En Progreso' && cambios.iniciada_at === undefined) {
      cambios.iniciada_at = new Date();
    }

    return this.prisma.tareasAseo.update({
      where: { id },
      data: cambios,
      include: DATOS_RELACIONADOS,
    });
  }

  // ==========================================
  // NOVEDADES (daños o faltantes que reporta el limpiador)
  // ==========================================

  async reportarNovedad(id: string, data: any) {
    const descripcion = String(data?.descripcion ?? '').trim();
    const fotos = this.normalizarFotos(data?.fotos);

    if (!descripcion && fotos.length === 0) {
      throw new HttpException(
        'El reporte necesita al menos una descripción o una foto.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Si el limpiador quitó fotos al corregir su reporte, no las dejamos botadas en Storage
    const anterior = await this.prisma.tareasAseo.findUnique({ where: { id } });
    const descartadas = (anterior?.novedad_fotos || []).filter(
      (url) => !fotos.includes(url),
    );
    if (descartadas.length > 0) await this.borrarFotosDeStorage(descartadas);

    return this.prisma.tareasAseo.update({
      where: { id },
      data: {
        novedad_reportada: descripcion,
        novedad_fotos: fotos,
        novedad_estado: 'Pendiente',
        novedad_at: new Date(),
        novedad_resuelta_at: null,
      },
      include: DATOS_RELACIONADOS,
    });
  }

  async cambiarEstadoNovedad(id: string, estado: string) {
    const resuelta = String(estado || '').toLowerCase() === 'resuelta';

    return this.prisma.tareasAseo.update({
      where: { id },
      data: {
        novedad_estado: resuelta ? 'Resuelta' : 'Pendiente',
        novedad_resuelta_at: resuelta ? new Date() : null,
      },
      include: DATOS_RELACIONADOS,
    });
  }

  async eliminarNovedad(id: string) {
    const tarea = await this.prisma.tareasAseo.findUnique({ where: { id } });
    if (!tarea) {
      throw new HttpException('La tarea no existe', HttpStatus.NOT_FOUND);
    }

    await this.borrarFotosDeStorage(tarea.novedad_fotos || []);

    return this.prisma.tareasAseo.update({
      where: { id },
      data: {
        novedad_reportada: null,
        novedad_fotos: [],
        novedad_estado: null,
        novedad_at: null,
        novedad_resuelta_at: null,
      },
      include: DATOS_RELACIONADOS,
    });
  }

  // Permiso temporal para que el celular del limpiador suba la foto directo a Storage
  async crearUrlSubida(extension: string, tareaId?: string) {
    const permitidas = ['jpg', 'jpeg', 'png', 'webp'];
    const ext = (extension || 'webp').toLowerCase().replace('jpeg', 'jpg');

    if (!permitidas.includes(ext)) {
      throw new HttpException(
        'Formato no permitido. Solo JPG, PNG o WEBP.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const carpeta = `${CARPETA_NOVEDADES}/${tareaId || 'sin-asignar'}`;
    const nombre = `${carpeta}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { data, error } = await this.supabase.storage
      .from(BUCKET_FOTOS)
      .createSignedUploadUrl(nombre);

    if (error) {
      throw new HttpException(
        `No se pudo preparar la subida: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const { data: publico } = this.supabase.storage
      .from(BUCKET_FOTOS)
      .getPublicUrl(nombre);

    return { signedUrl: data.signedUrl, publicUrl: publico.publicUrl };
  }

  private normalizarFotos(fotos: any): string[] {
    if (!Array.isArray(fotos)) return [];
    return fotos
      .filter((f) => typeof f === 'string' && f.trim() !== '')
      .slice(0, 10);
  }

  // Las fotos borradas no deben quedarse ocupando espacio en Storage
  private async borrarFotosDeStorage(urls: string[]) {
    const separador = `/${BUCKET_FOTOS}/`;
    const rutas = urls
      .map((url) => {
        const partes = String(url).split(separador);
        return partes.length > 1 ? partes[1].split('?')[0] : null;
      })
      .filter((ruta): ruta is string => !!ruta);

    if (rutas.length === 0) return;

    const { error } = await this.supabase.storage
      .from(BUCKET_FOTOS)
      .remove(rutas);

    // Si Storage falla no bloqueamos el borrado del reporte, solo lo dejamos anotado
    if (error) console.error('No se pudieron borrar las fotos:', error.message);
  }
}
