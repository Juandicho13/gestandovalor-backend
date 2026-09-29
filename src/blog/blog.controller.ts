import { Controller, Get, Post, Patch, Delete, Body, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { BlogService } from './blog.service';
import { Publico, Roles } from '../auth/seguridad';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) { }

  // --- PÚBLICO (van primero para que no choquen con ':id') ---
  @Publico()
  @Get('resumen')
  findAllResumen() {
    return this.blogService.findAllResumen();
  }

  @Publico()
  @Get('publico/:id')
  findOnePublico(@Param('id') id: string) {
    return this.blogService.findOnePublico(id);
  }

  @Publico()
  @Get(':id/portada')
  async portada(@Param('id') id: string, @Res() res: Response) {
    const resultado = await this.blogService.obtenerPortada(id);

    if ('redirigir' in resultado) {
      return res.redirect(302, resultado.redirigir);
    }

    res.set({
      'Content-Type': resultado.mime,
      'Content-Length': resultado.buffer.length,
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
    res.end(resultado.buffer);
  }

  // --- PANEL (solo el admin escribe y edita el blog) ---
  @Roles('ADMIN')
  @Post()
  create(@Body() createBlogDto: any) {
    return this.blogService.create(createBlogDto);
  }

  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.blogService.findAll();
  }

  @Roles('ADMIN')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.blogService.findOne(id);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBlogDto: any) {
    return this.blogService.update(id, updateBlogDto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.blogService.remove(id);
  }
}