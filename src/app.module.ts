import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProspectosModule } from './prospectos/prospectos.module';
import { PrismaService } from './prisma/prisma.service';
import { UsuariosController } from './usuarios/usuarios.controller';
import { AuthController } from './auth/auth.controller';

@Module({
  imports: [ProspectosModule],
  controllers: [AppController, UsuariosController, AuthController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
