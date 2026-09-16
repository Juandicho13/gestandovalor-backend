import { Injectable, NotFoundException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';

const API_PUBLICA = process.env.PUBLIC_API_URL || 'https://gestandovalor-backend.onrender.com';
const BUCKET = 'fotos-propiedades';
const MINUTOS_CACHE = 5;
const PATRON_IMAGEN_BASE64 = /data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g;

@Injectable()
export class BlogService {
  private supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_KEY as string,
  );

  // Memoria temporal: el blog cambia poco, así evitamos ir a la base de datos en cada visita
  private cache = new Map<string, { expira: number; valor: unknown }>();
  private migrando = false;
  private migracionHecha = false;

  constructor(private readonly prisma: PrismaService) { }

  // ============================================================
  // PANEL (admin): datos completos, sin memoria temporal
  // ============================================================
  async create(data: any) {
    const conImagenes = await this.moverImagenesAStorage(data);
    const articulo = await this.prisma.articuloBlog.create({
      data: {
        titulo: conImagenes.titulo,
        categoria: conImagenes.categoria,
        tiempo_lectura: conImagenes.tiempo_lectura,
        foto_url: conImagenes.foto_url,
        contenido: conImagenes.contenido,
        estado: conImagenes.estado,
      },
    });
    this.invalidarCache();
    return articulo;
  }

  findAll() {
    return this.prisma.articuloBlog.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  findOne(id: string) {
    return this.prisma.articuloBlog.findUnique({
      where: { id: this.idNumerico(id) }
    });
  }

  async update(id: string, updateData: any) {
    const conImagenes = await this.moverImagenesAStorage(updateData);
    const articulo = await this.prisma.articuloBlog.update({
      where: { id: this.idNumerico(id) },
      data: conImagenes,
    });
    this.invalidarCache();
    return articulo;
  }

  async remove(id: string) {
    const articulo = await this.prisma.articuloBlog.delete({
      where: { id: this.idNumerico(id) }
    });
    this.invalidarCache();
    return articulo;
  }

  // ============================================================
  // PÚBLICO: lista y artículo, con memoria temporal
  // ============================================================
  async findAllResumen() {
    const enCache = this.leerCache('resumen');
    if (enCache) return enCache;

    const articulos = await this.prisma.articuloBlog.findMany({
      select: {
        id: true,
        titulo: true,
        categoria: true,
        tiempo_lectura: true,
        foto_url: true,
        createdAt: true,
        updatedAt: true,
        estado: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const hayImagenesViejas = articulos.some((a) => this.esBase64(a.foto_url));
    if (hayImagenesViejas) this.migrarImagenesViejas();

    const resultado = articulos.map((a) => ({
      ...a,
      foto_url: this.urlPortadaPublica(a.id, a.foto_url, a.updatedAt),
    }));

    this.guardarCache('resumen', resultado);
    return resultado;
  }

  async findOnePublico(id: string) {
    const numero = this.idNumerico(id);
    const clave = `articulo-${numero}`;
    const enCache = this.leerCache(clave);
    if (enCache) return enCache;

    const articulo = await this.prisma.articuloBlog.findUnique({ where: { id: numero } });
    if (!articulo || articulo.estado !== 'Publicado') {
      throw new NotFoundException('Artículo no encontrado');
    }

    if (this.esBase64(articulo.foto_url) || articulo.contenido.includes('data:image')) {
      this.migrarImagenesViejas();
    }

    const resultado = {
      ...articulo,
      foto_url: this.urlPortadaPublica(articulo.id, articulo.foto_url, articulo.updatedAt),
    };

    this.guardarCache(clave, resultado);
    return resultado;
  }

  // Portadas viejas guardadas como base64: se entregan como imagen que el navegador puede guardar
  async obtenerPortada(id: string): Promise<{ redirigir: string } | { mime: string; buffer: Buffer }> {
    const articulo = await this.prisma.articuloBlog.findUnique({
      where: { id: this.idNumerico(id) },
      select: { foto_url: true },
    });
    if (!articulo?.foto_url) throw new NotFoundException('Artículo sin portada');

    const match = articulo.foto_url.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) return { redirigir: articulo.foto_url };

    return { mime: match[1], buffer: Buffer.from(match[2], 'base64') };
  }

  // ------------------------------------------------------------
  // Utilidades internas
  // ------------------------------------------------------------
  private idNumerico(id: string) {
    const numero = Number(id);
    if (!Number.isInteger(numero) || numero <= 0) {
      throw new NotFoundException('Artículo no encontrado');
    }
    return numero;
  }

  private esBase64(valor: string | null | undefined) {
    return typeof valor === 'string' && valor.startsWith('data:image');
  }

  private urlPortadaPublica(id: number, fotoUrl: string | null, actualizado: Date) {
    if (!this.esBase64(fotoUrl)) return fotoUrl;
    return `${API_PUBLICA}/blog/${id}/portada?v=${new Date(actualizado).getTime()}`;
  }

  private leerCache(clave: string) {
    const guardado = this.cache.get(clave);
    if (!guardado) return null;
    if (guardado.expira < Date.now()) {
      this.cache.delete(clave);
      return null;
    }
    return guardado.valor;
  }

  private guardarCache(clave: string, valor: unknown) {
    this.cache.set(clave, { expira: Date.now() + MINUTOS_CACHE * 60 * 1000, valor });
  }

  private invalidarCache() {
    this.cache.clear();
  }

  // Sube una imagen base64 a Storage y devuelve su URL pública
  private async subirImagen(dataUrl: string): Promise<string> {
    const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) return dataUrl;

    const mime = match[1];
    const buffer = Buffer.from(match[2], 'base64');
    const extension = (mime.split('/')[1] || 'jpg').replace('jpeg', 'jpg').replace('+xml', '');
    const nombre = `blog/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

    const { error } = await this.supabase.storage
      .from(BUCKET)
      .upload(nombre, buffer, { contentType: mime, cacheControl: '31536000' });

    if (error) throw new Error(`No se pudo subir la imagen del blog: ${error.message}`);

    return this.supabase.storage.from(BUCKET).getPublicUrl(nombre).data.publicUrl;
  }

  // Cambia las imágenes base64 (portada y fotos dentro del texto) por URLs de Storage.
  // Si Storage falla, se guarda como antes para no bloquear la publicación.
  private async moverImagenesAStorage<T extends { foto_url?: string | null; contenido?: string }>(data: T): Promise<T> {
    const resultado = { ...data };
    try {
      if (this.esBase64(resultado.foto_url)) {
        resultado.foto_url = await this.subirImagen(resultado.foto_url as string);
      }

      if (typeof resultado.contenido === 'string' && resultado.contenido.includes('data:image')) {
        const encontradas = [...new Set(resultado.contenido.match(PATRON_IMAGEN_BASE64) || [])];
        let contenido = resultado.contenido;
        for (const dataUrl of encontradas) {
          const url = await this.subirImagen(dataUrl);
          contenido = contenido.split(dataUrl).join(url);
        }
        resultado.contenido = contenido;
      }
    } catch (error) {
      console.error('Blog: no se pudieron mover las imágenes a Storage', error);
      return { ...data };
    }
    return resultado;
  }

  // Una sola vez por arranque: pasa a Storage las imágenes de artículos viejos
  private async migrarImagenesViejas() {
    if (this.migrando || this.migracionHecha) return;
    this.migrando = true;

    try {
      const articulos = await this.prisma.articuloBlog.findMany({
        select: { id: true, foto_url: true, contenido: true },
      });

      for (const articulo of articulos) {
        const tieneBase64 = this.esBase64(articulo.foto_url) || articulo.contenido.includes('data:image');
        if (!tieneBase64) continue;

        const nuevo = await this.moverImagenesAStorage({
          foto_url: articulo.foto_url,
          contenido: articulo.contenido,
        });

        if (nuevo.foto_url !== articulo.foto_url || nuevo.contenido !== articulo.contenido) {
          await this.prisma.articuloBlog.update({
            where: { id: articulo.id },
            data: { foto_url: nuevo.foto_url, contenido: nuevo.contenido },
          });
        }
      }

      this.migracionHecha = true;
      this.invalidarCache();
    } catch (error) {
      console.error('Blog: falló la migración de imágenes viejas', error);
    } finally {
      this.migrando = false;
    }
  }
}