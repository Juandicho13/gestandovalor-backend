import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProspectosModule } from './prospectos/prospectos.module';
import { PrismaService } from './prisma/prisma.service';
import { UsuariosController } from './usuarios/usuarios.controller';
import { PropiedadesModule } from './propiedades/propiedades.module';
import { ReservasModule } from './reservas/reservas.module';
import { TareasAseoModule } from './tareas-aseo/tareas-aseo.module';
import { LiquidacionesModule } from './liquidaciones/liquidaciones.module';
import { BlogModule } from './blog/blog.module';
import { DisponibilidadModule } from './disponibilidad/disponibilidad.module';

// ✨ AQUÍ IMPORTAMOS EL NUEVO MÓDULO DE TARIFAS
import { TarifasModule } from './tarifas/tarifas.module';
import { PagosModule } from './pagos/pagos.module';

// 🔐 Seguridad
import { AuthModule } from './auth/auth.module';
import { JwtGuard } from './auth/jwt.guard';
import { RolesGuard } from './auth/roles.guard';

@Module({
  imports: [
    // Tope general de peticiones por IP (el login tiene su propio tope, más estricto)
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 200 }]),
    AuthModule,
    ProspectosModule,
    PropiedadesModule,
    ReservasModule,
    TareasAseoModule,
    LiquidacionesModule,
    BlogModule,
    DisponibilidadModule,
    TarifasModule,
    PagosModule // ✨ Y AQUÍ LO MATRICULAMOS PARA QUE EL SERVIDOR LO ESCUCHE
  ],
  controllers: [
    AppController,
    UsuariosController
  ],
  providers: [
    AppService,
    PrismaService,
    // El orden importa: primero el tope de peticiones, luego el token, luego el rol.
    // Al ser globales, TODO queda cerrado por defecto y se abre con @Publico().
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule { }