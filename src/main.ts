import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
// ✨ IMPORTA ESTO ARRIBA ✨
import { json, urlencoded } from 'express';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.use(compression());

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // En tu main.ts, cambia las validaciones globales a esto:
  app.useGlobalPipes(new ValidationPipe({
    whitelist: false,             // <-- Cambiado a false
    forbidNonWhitelisted: false,  // <-- Cambiado a false
    transform: true,
  }));

  await app.listen(3000); // (O el puerto que tengas configurado)
}
bootstrap();