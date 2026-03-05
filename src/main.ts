import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Asegurar que las webs externas puedan conectarse (CORS)
  app.enableCors();

  // 2. LA MAGIA: Aumentar el límite de peso a 50 Megabytes para que pasen las fotos
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  await app.listen(process.env.PORT || 3000);
}
bootstrap();