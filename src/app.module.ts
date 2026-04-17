import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProspectosModule } from './prospectos/prospectos.module';
import { PrismaService } from './prisma/prisma.service';
import { UsuariosController } from './usuarios/usuarios.controller';
import { AuthController } from './auth/auth.controller';
import { PropiedadesModule } from './propiedades/propiedades.module';
import { ReservasModule } from './reservas/reservas.module';
import { TareasAseoModule } from './tareas-aseo/tareas-aseo.module';
import { LiquidacionesModule } from './liquidaciones/liquidaciones.module';
import { BlogModule } from './blog/blog.module';
import { DisponibilidadModule } from './disponibilidad/disponibilidad.module';

// ✨ AQUÍ IMPORTAMOS EL NUEVO MÓDULO DE TARIFAS
import { TarifasModule } from './tarifas/tarifas.module';

@Module({
  imports: [
    ProspectosModule,
    PropiedadesModule,
    ReservasModule,
    TareasAseoModule,
    LiquidacionesModule,
    BlogModule,
    DisponibilidadModule,
    TarifasModule // ✨ Y AQUÍ LO MATRICULAMOS PARA QUE EL SERVIDOR LO ESCUCHE
  ],
  controllers: [
    AppController,
    UsuariosController,
    AuthController
  ],
  providers: [AppService, PrismaService],
})
export class AppModule { }