import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
// ✨ IMPORTA ESTO ARRIBA ✨
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  // ✨ AQUÍ ESTÁ LA MAGIA: AMPLIAMOS EL LÍMITE A 50MB ✨
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  await app.listen(3000); // (O el puerto que tengas configurado)
}
bootstrap();

//come popo render