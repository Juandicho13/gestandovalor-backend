import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProspectosModule } from './prospectos/prospectos.module';
import { PrismaService } from './prisma/prisma.service';
import { UsuariosController } from './usuarios/usuarios.controller';
import { AuthController } from './auth/auth.controller';
import { PropiedadesModule } from './propiedades/propiedades.module';
import { ReservasModule } from './reservas/reservas.module';
import { InventariosModule } from './inventarios/inventarios.module';
import { TareasAseoModule } from './tareas-aseo/tareas-aseo.module';
import { LiquidacionesModule } from './liquidaciones/liquidaciones.module';
import { BlogModule } from './blog/blog.module';
import { DisponibilidadModule } from './disponibilidad/disponibilidad.module';

// 👇 1. Importamos el nuevo controlador que creamos
import { LiquidacionesController } from './liquidaciones/liquidaciones.controller'; 

@Module({
  imports: [
    ProspectosModule, 
    PropiedadesModule, 
    ReservasModule, 
    InventariosModule, 
    TareasAseoModule, 
    LiquidacionesModule, 
    BlogModule, 
    DisponibilidadModule
  ],
  controllers: [
    AppController, 
    UsuariosController, 
    AuthController, 
    LiquidacionesController // 👇 2. Lo conectamos al cerebro principal
  ],
  providers: [AppService, PrismaService],
})
export class AppModule {}